const { PrismaClient, SplitType, ActivityType } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Transaction pooler (6543) breaks prepared statements — seed via session/direct URL.
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  await prisma.activity.deleteMany();
  await prisma.settlement.deleteMany();
  await prisma.expenseSplit.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [];
  for (const name of ['Sid', 'Rahul', 'Aman', 'Neha']) {
    users.push(
      await prisma.user.create({
        data: {
          name,
          email: `${name.toLowerCase()}@pocket.test`,
          passwordHash,
        },
      })
    );
  }
  const [sid, rahul, aman, neha] = users;

  const group = await prisma.group.create({
    data: {
      name: 'Flatmates',
      inviteCode: 'FLATMATES',
      createdById: sid.id,
      members: {
        create: [sid, rahul, aman, neha].map((user) => ({
          userId: user.id,
        })),
      },
    },
  });

  const addExpense = async ({ title, totalAmount, paidBy, splitType, splits }) => {
    const expense = await prisma.expense.create({
      data: {
        groupId: group.id,
        title,
        totalAmount,
        paidById: paidBy.id,
        splitType,
        splits: {
          create: splits.map(([user, amountOwed]) => ({
            userId: user.id,
            amountOwed,
          })),
        },
      },
    });

    await prisma.activity.create({
      data: {
        groupId: group.id,
        userId: paidBy.id,
        type: ActivityType.EXPENSE_ADDED,
        message: `${paidBy.name} added "${title}"`,
        metadata: { expenseId: expense.id, totalAmount },
      },
    });
  };

  await addExpense({
    title: 'Dinner',
    totalAmount: 120000,
    paidBy: sid,
    splitType: SplitType.UNEQUAL,
    splits: [
      [rahul, 40000],
      [aman, 30000],
      [neha, 50000],
    ],
  });

  await addExpense({
    title: 'Wifi',
    totalAmount: 160000,
    paidBy: rahul,
    splitType: SplitType.EQUAL,
    splits: [
      [sid, 40000],
      [rahul, 40000],
      [aman, 40000],
      [neha, 40000],
    ],
  });

  await addExpense({
    title: 'Groceries',
    totalAmount: 200000,
    paidBy: aman,
    splitType: SplitType.EQUAL,
    splits: [
      [sid, 50000],
      [rahul, 50000],
      [aman, 50000],
      [neha, 50000],
    ],
  });

  await prisma.activity.create({
    data: {
      groupId: group.id,
      userId: sid.id,
      type: ActivityType.GROUP_CREATED,
      message: 'Sid created Flatmates',
    },
  });

  console.log('Seeded Pocket demo data');
  console.log('Demo password: password123');
  console.log('Users: sid@pocket.test, rahul@pocket.test, aman@pocket.test, neha@pocket.test');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
