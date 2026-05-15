---
name: pocket-builder
description: Build and modify Pocket, a minimal roommate expense splitting app. Use when working on Pocket expenses, split validation, settlements, Prisma schema, auth, groups, activity feed, or UI.
---

# Pocket Builder

## Core Priority

Working balance netting logic beats UI polish. Do not add notifications, wallets, crypto, chat, banking, or other side quests before expense creation, settlement, persistence, and balance math are correct.

## Money Rules

- Store all money as integer paise.
- Parse user input once at the boundary.
- Never use `parseFloat` for ledger math.
- Format money only for display.
- Treat 1 paise as smallest tolerance. Avoid floating epsilon checks.

## Ledger Invariants

- Balances derive from persisted `Expense`, `ExpenseSplit`, and `Settlement` rows.
- No cached balance table is source of truth.
- `sum(expenseSplits.amountOwed) === expense.totalAmount`.
- `paidById`, split participants, settlement payer, and settlement receiver must be active group members.
- Use database transactions for multi-row expense creation, settlement creation, delete/void flows, and member leave flows.

## Balance Algorithm

For each expense:

```ts
net[paidById] += expense.totalAmount
for (const split of expense.splits) net[split.userId] -= split.amountOwed
```

For each completed settlement:

```ts
net[payerId] += settlement.amount
net[receiverId] -= settlement.amount
```

Positive net receives money. Negative net owes money. Match debtors to creditors until one side is empty:

```ts
while (debtors.length && creditors.length) {
  const amount = Math.min(-debtor.net, creditor.net)
  settlements.push({ payerId: debtor.id, receiverId: creditor.id, amount })
  debtor.net += amount
  creditor.net -= amount
}
```

## Expense Rules

- Equal split: divide total among selected participants, allocate remainder by stable participant order.
- Unequal split: require explicit paise values and exact total match.
- Deleted expenses should be soft-deleted if activity/history matters.
- Settlements should remain auditable and not mutate original expenses.

## UI Rules

- Use shadcn/ui primitives before raw controls.
- Make add expense amount-first and keyboard friendly.
- Show exact “payer pays receiver amount” rows.
- Surface invalid split totals inline beside split fields.
- Keep mobile actions thumb reachable.

## Required Tests

- Prompt examples for minimized settlements.
- Equal split remainder allocation.
- Unequal split invalid total rejection.
- Settlement updates net balances.
- Deleted expense excluded from active ledger.
- Member leave with historical rows soft-deactivates membership.
