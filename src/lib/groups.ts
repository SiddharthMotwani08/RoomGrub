import type { Prisma } from '@prisma/client';
import { notFound } from 'next/navigation';
import { db } from './db';

export async function requireActiveGroupMember(userId: string, groupId: string) {
  const membership = await db.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    include: { group: true },
  });

  if (!membership?.active) notFound();
  return membership;
}

/** One DB round-trip: group + membership check (faster than findUnique + separate member check). */
export async function findGroupForActiveMember<I extends Prisma.GroupInclude>(
  userId: string,
  groupId: string,
  include: I
): Promise<Prisma.GroupGetPayload<{ include: I }>> {
  const group = await db.group.findFirst({
    where: {
      id: groupId,
      members: { some: { userId, active: true } },
    },
    include,
  });
  if (!group) notFound();
  return group;
}
