'use server';

import { ActivityType, SplitType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createActivity } from '@/lib/activity';
import { db } from '@/lib/db';
import { requireActiveGroupMember } from '@/lib/groups';
import { parseRupeesToPaise, splitEqual } from '@/lib/money';
import { requireUser } from '@/lib/session';

const expenseSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(100),
  totalAmount: z.string().trim().min(1),
  paidById: z.string().min(1),
  splitType: z.nativeEnum(SplitType),
});

export async function addExpense(groupId: string, formData: FormData) {
  const user = await requireUser();
  await requireActiveGroupMember(user.id, groupId);

  const parsed = expenseSchema.safeParse({
    title: formData.get('title'),
    totalAmount: formData.get('totalAmount'),
    paidById: formData.get('paidById'),
    splitType: formData.get('splitType'),
  });
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? 'Invalid expense');

  const totalAmount = parseRupeesToPaise(parsed.data.totalAmount);
  const participantIds = formData.getAll('participants').map(String);
  if (participantIds.length === 0) throw new Error('Choose at least one participant');

  const activeMembers = await db.groupMember.findMany({
    where: { groupId, active: true },
    select: { userId: true, user: { select: { name: true } } },
  });
  const activeUserIds = new Set(activeMembers.map((member) => member.userId));
  if (!activeUserIds.has(parsed.data.paidById)) throw new Error('Payer must be a group member');
  if (participantIds.some((id) => !activeUserIds.has(id))) throw new Error('All participants must be group members');

  const splitAmounts =
    parsed.data.splitType === SplitType.EQUAL
      ? splitEqual(totalAmount, participantIds)
      : parseUnequalSplits(formData, participantIds, totalAmount);

  await db.$transaction(async (tx) => {
    const expense = await tx.expense.create({
      data: {
        groupId,
        title: parsed.data.title,
        totalAmount,
        paidById: parsed.data.paidById,
        splitType: parsed.data.splitType,
        splits: {
          create: [...splitAmounts.entries()].map(([userId, amountOwed]) => ({
            userId,
            amountOwed,
          })),
        },
      },
    });

    await createActivity({
      groupId,
      userId: user.id,
      type: ActivityType.EXPENSE_ADDED,
      message: `${user.name ?? 'Someone'} added "${parsed.data.title}"`,
      metadata: { expenseId: expense.id, totalAmount },
      tx,
    });
  });

  revalidatePath(`/groups/${groupId}`);
  redirect(`/groups/${groupId}`);
}

function parseUnequalSplits(formData: FormData, participantIds: string[], totalAmount: number) {
  const result = new Map<string, number>();
  let sum = 0;

  for (const userId of participantIds) {
    const amount = parseRupeesToPaise(String(formData.get(`split-${userId}`) ?? ''));
    result.set(userId, amount);
    sum += amount;
  }

  if (sum !== totalAmount) {
    throw new Error('Unequal split total must equal expense total');
  }

  return result;
}

export async function settleUp(groupId: string, formData: FormData) {
  const user = await requireUser();
  await requireActiveGroupMember(user.id, groupId);

  const payerId = String(formData.get('payerId') ?? '');
  const receiverId = String(formData.get('receiverId') ?? '');
  const amount = Number(formData.get('amount') ?? 0);
  if (!payerId || !receiverId || payerId === receiverId || !Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error('Invalid settlement');
  }

  const members = await db.groupMember.findMany({ where: { groupId, active: true }, select: { userId: true } });
  const memberIds = new Set(members.map((member) => member.userId));
  if (!memberIds.has(payerId) || !memberIds.has(receiverId)) throw new Error('Settlement users must be active members');

  const idempotencyKey = `${groupId}:${payerId}:${receiverId}:${amount}`;
  await db.$transaction(async (tx) => {
    const existing = await tx.settlement.findUnique({ where: { idempotencyKey } });
    if (existing) return;

    const settlement = await tx.settlement.create({
      data: { groupId, payerId, receiverId, amount, idempotencyKey },
      include: { payer: true, receiver: true },
    });

    await createActivity({
      groupId,
      userId: user.id,
      type: ActivityType.SETTLEMENT_COMPLETED,
      message: `${settlement.payer.name} settled with ${settlement.receiver.name}`,
      metadata: { settlementId: settlement.id, amount },
      tx,
    });
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function deleteExpense(groupId: string, expenseId: string) {
  const user = await requireUser();
  await requireActiveGroupMember(user.id, groupId);

  await db.$transaction(async (tx) => {
    const expense = await tx.expense.update({
      where: { id: expenseId, groupId },
      data: { deletedAt: new Date() },
    });

    await createActivity({
      groupId,
      userId: user.id,
      type: ActivityType.EXPENSE_DELETED,
      message: `${user.name ?? 'Someone'} deleted "${expense.title}"`,
      metadata: { expenseId },
      tx,
    });
  });

  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroup(groupId: string) {
  const user = await requireUser();
  await requireActiveGroupMember(user.id, groupId);

  await db.$transaction(async (tx) => {
    const hasHistory = await tx.expense.count({ where: { groupId, OR: [{ paidById: user.id }, { splits: { some: { userId: user.id } } }] } });
    const hasSettlements = await tx.settlement.count({ where: { groupId, OR: [{ payerId: user.id }, { receiverId: user.id }] } });

    if (hasHistory || hasSettlements) {
      await tx.groupMember.update({
        where: { userId_groupId: { userId: user.id, groupId } },
        data: { active: false, leftAt: new Date() },
      });
    } else {
      await tx.groupMember.delete({ where: { userId_groupId: { userId: user.id, groupId } } });
    }

    await createActivity({
      groupId,
      userId: user.id,
      type: ActivityType.MEMBER_LEFT,
      message: `${user.name ?? 'Someone'} left the group`,
      tx,
    });
  });

  revalidatePath('/');
  redirect('/');
}
