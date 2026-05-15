import { calculateNetBalances, minimizeSettlements } from '@/lib/balances';
import { parseRupeesToPaise, splitEqual } from '@/lib/money';

const users = [
  { id: 'a', name: 'A', email: 'a@test.com' },
  { id: 'b', name: 'B', email: 'b@test.com' },
  { id: 'c', name: 'C', email: 'c@test.com' },
];

describe('Pocket money helpers', () => {
  it('parses rupees into paise without float math', () => {
    expect(parseRupeesToPaise('1,200.50')).toBe(120050);
  });

  it('allocates equal split remainder by stable participant order', () => {
    expect([...splitEqual(100, ['a', 'b', 'c']).entries()]).toEqual([
      ['a', 34],
      ['b', 33],
      ['c', 33],
    ]);
  });
});

describe('Pocket balance netting', () => {
  it('matches debtor-creditor prompt example', () => {
    const suggestions = minimizeSettlements([
      { user: users[0], net: 100000 },
      { user: users[1], net: -60000 },
      { user: users[2], net: -40000 },
    ]);

    expect(suggestions).toEqual([
      { payerId: 'b', payerName: 'B', receiverId: 'a', receiverName: 'A', amount: 60000 },
      { payerId: 'c', payerName: 'C', receiverId: 'a', receiverName: 'A', amount: 40000 },
    ]);
  });

  it('nets expenses and settlements from persisted ledger rows', () => {
    const balances = calculateNetBalances({
      members: users,
      expenses: [
        {
          paidById: 'a',
          totalAmount: 120000,
          splits: [
            { userId: 'a', amountOwed: 40000 },
            { userId: 'b', amountOwed: 40000 },
            { userId: 'c', amountOwed: 40000 },
          ],
        },
      ],
      settlements: [{ payerId: 'b', receiverId: 'a', amount: 20000 }],
    });

    expect(balances.map((balance) => [balance.user.id, balance.net])).toEqual([
      ['a', 60000],
      ['b', -20000],
      ['c', -40000],
    ]);
  });
});
