'use server';

import { ActivityType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createActivity } from '@/lib/activity';
import { db } from '@/lib/db';
import { createUniqueInviteCode } from '@/lib/invites';
import { requireUser } from '@/lib/session';

const groupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(80),
});

export async function createGroup(formData: FormData) {
  const user = await requireUser();
  const parsed = groupSchema.safeParse({ name: formData.get('name') });
  if (!parsed.success) return;

  const inviteCode = await createUniqueInviteCode();
  const group = await db.$transaction(async (tx) => {
    const created = await tx.group.create({
      data: {
        name: parsed.data.name,
        inviteCode,
        createdById: user.id,
        members: {
          create: { userId: user.id },
        },
      },
    });

    await createActivity({
      groupId: created.id,
      userId: user.id,
      type: ActivityType.GROUP_CREATED,
      message: `${user.name ?? 'Someone'} created ${created.name}`,
      tx,
    });

    return created;
  });

  revalidatePath('/');
  redirect(`/groups/${group.id}`);
}

export async function joinGroup(formData: FormData) {
  const user = await requireUser();
  const inviteCode = String(formData.get('inviteCode') ?? '').trim().toUpperCase();
  if (!inviteCode) return;

  const group = await db.group.findUnique({ where: { inviteCode } });
  if (!group) return;

  await db.$transaction(async (tx) => {
    await tx.groupMember.upsert({
      where: { userId_groupId: { userId: user.id, groupId: group.id } },
      create: { userId: user.id, groupId: group.id },
      update: { active: true, leftAt: null },
    });

    await createActivity({
      groupId: group.id,
      userId: user.id,
      type: ActivityType.MEMBER_JOINED,
      message: `${user.name ?? 'Someone'} joined ${group.name}`,
      tx,
    });
  });

  revalidatePath('/');
  redirect(`/groups/${group.id}`);
}
