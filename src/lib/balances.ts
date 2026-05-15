import type { Expense, ExpenseSplit, Settlement, User } from '@prisma/client';

export type MemberBalance = {
  user: Pick<User, 'id' | 'name' | 'email'>;
  net: number;
};

export type SuggestedSettlement = {
  payerId: string;
  payerName: string;
  receiverId: string;
  receiverName: string;
  amount: number;
};

type ExpenseWithSplits = Pick<Expense, 'paidById' | 'totalAmount'> & {
  splits: Pick<ExpenseSplit, 'userId' | 'amountOwed'>[];
};

type LedgerSettlement = Pick<Settlement, 'payerId' | 'receiverId' | 'amount'>;

export function calculateNetBalances({
  members,
  expenses,
  settlements,
}: {
  members: Pick<User, 'id' | 'name' | 'email'>[];
  expenses: ExpenseWithSplits[];
  settlements: LedgerSettlement[];
}): MemberBalance[] {
  const net = new Map(members.map((member) => [member.id, 0]));

  for (const expense of expenses) {
    net.set(expense.paidById, (net.get(expense.paidById) ?? 0) + expense.totalAmount);
    for (const split of expense.splits) {
      net.set(split.userId, (net.get(split.userId) ?? 0) - split.amountOwed);
    }
  }

  for (const settlement of settlements) {
    net.set(settlement.payerId, (net.get(settlement.payerId) ?? 0) + settlement.amount);
    net.set(settlement.receiverId, (net.get(settlement.receiverId) ?? 0) - settlement.amount);
  }

  return members.map((user) => ({ user, net: net.get(user.id) ?? 0 }));
}

export function minimizeSettlements(balances: MemberBalance[]): SuggestedSettlement[] {
  const debtors = balances
    .filter((balance) => balance.net < 0)
    .map((balance) => ({ ...balance, net: balance.net }))
    .sort((a, b) => a.net - b.net);

  const creditors = balances
    .filter((balance) => balance.net > 0)
    .map((balance) => ({ ...balance, net: balance.net }))
    .sort((a, b) => b.net - a.net);

  const settlements: SuggestedSettlement[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = Math.min(-debtor.net, creditor.net);

    if (amount > 0) {
      settlements.push({
        payerId: debtor.user.id,
        payerName: debtor.user.name,
        receiverId: creditor.user.id,
        receiverName: creditor.user.name,
        amount,
      });
    }

    debtor.net += amount;
    creditor.net -= amount;

    if (debtor.net === 0) debtorIndex += 1;
    if (creditor.net === 0) creditorIndex += 1;
  }

  return settlements;
}
