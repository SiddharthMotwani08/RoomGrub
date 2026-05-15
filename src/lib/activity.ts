import type { ActivityType, Prisma } from '@prisma/client';
import { db } from './db';

export async function createActivity({
  groupId,
  userId,
  type,
  message,
  metadata,
  tx,
}: {
  groupId: string;
  userId?: string | null;
  type: ActivityType;
  message: string;
  metadata?: Prisma.InputJsonValue;
  tx?: Prisma.TransactionClient;
}) {
  const client = tx ?? db;
  return client.activity.create({
    data: {
      groupId,
      userId,
      type,
      message,
      metadata,
    },
  });
}
