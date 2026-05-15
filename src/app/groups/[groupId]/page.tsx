import Link from 'next/link';
import { calculateNetBalances, minimizeSettlements } from '@/lib/balances';
import { findGroupForActiveMember } from '@/lib/groups';
import { formatPaise } from '@/lib/money';
import { requireUser } from '@/lib/session';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { deleteExpense, leaveGroup, settleUp } from './actions';

export default async function GroupPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await findGroupForActiveMember(user.id, groupId, {
    members: {
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    },
    expenses: {
      where: { deletedAt: null },
      include: {
        paidBy: { select: { id: true, name: true, email: true } },
        splits: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    },
    settlements: {
      include: {
        payer: { select: { id: true, name: true, email: true } },
        receiver: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    },
  });

  const members = group.members.map((member) => member.user);
  const activeMembers = group.members.filter((member) => member.active);
  const balances = calculateNetBalances({
    members,
    expenses: group.expenses,
    settlements: group.settlements,
  });
  const suggested = minimizeSettlements(balances);

  return (
    <main className="pocket-shell mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/" className="text-sm font-medium text-emerald-900/80 hover:text-emerald-950">
            ← Groups
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{group.name}</h1>
          <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 font-mono text-sm text-slate-600 shadow-sm backdrop-blur-sm">
            Invite <span className="font-semibold text-emerald-800">{group.inviteCode}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/groups/${group.id}/activity`}
            className="inline-flex min-h-10 items-center rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-emerald-200 hover:bg-white"
          >
            Activity
          </Link>
          <Link
            href={`/groups/${group.id}/expenses/new`}
            className="inline-flex min-h-10 items-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-emerald-900/15 transition hover:from-emerald-500 hover:to-teal-500"
          >
            Add expense
          </Link>
        </div>
      </header>

      <section className="grid gap-5 md:grid-cols-3">
        <Card className="pocket-card border-emerald-100/50 shadow-md shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>{activeMembers.length} active roommates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {group.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-xl border border-slate-100/80 bg-gradient-to-r from-white to-slate-50/90 px-3 py-2.5"
              >
                <span className="font-medium text-slate-800">{member.user.name}</span>
                <Badge tone={member.active ? 'green' : 'default'}>{member.active ? 'active' : 'left'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="pocket-card md:col-span-2 border-emerald-100/50 shadow-md shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Net balances</CardTitle>
            <CardDescription>Green = should receive · Red = owes</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {balances.map((balance) => (
              <div
                key={balance.user.id}
                className="rounded-xl border border-slate-100/90 bg-white/90 p-4 shadow-sm ring-1 ring-slate-900/5"
              >
                <p className="font-medium text-slate-800">{balance.user.name}</p>
                <p className={`mt-2 font-mono text-2xl font-semibold tracking-tight ${balance.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {balance.net >= 0 ? '+' : '-'}{formatPaise(Math.abs(balance.net))}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <Card className="pocket-card border-emerald-100/50 shadow-md shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Settle up</CardTitle>
            <CardDescription>Minimum transfers to zero everyone out.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggested.length === 0 ? (
              <p className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4 text-sm font-medium text-emerald-800">
                All squared away.
              </p>
            ) : (
              suggested.map((settlement) => (
                <form
                  action={settleUp.bind(null, group.id)}
                  key={`${settlement.payerId}-${settlement.receiverId}-${settlement.amount}`}
                  className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white/95 p-4 shadow-sm ring-1 ring-slate-900/5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <input type="hidden" name="payerId" value={settlement.payerId} />
                  <input type="hidden" name="receiverId" value={settlement.receiverId} />
                  <input type="hidden" name="amount" value={settlement.amount} />
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">{settlement.payerName}</span>
                    <span className="text-slate-500"> → </span>
                    <span className="font-semibold text-slate-900">{settlement.receiverName}</span>
                    <span className="ml-2 font-mono text-base font-bold text-emerald-700">{formatPaise(settlement.amount)}</span>
                  </p>
                  <Button className="shrink-0">Mark paid</Button>
                </form>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="pocket-card border-emerald-100/50 shadow-md shadow-slate-900/5">
          <CardHeader>
            <CardTitle>Recent expenses</CardTitle>
            <CardDescription>{group.expenses.length} total · showing latest</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.expenses.length === 0 ? (
              <p className="text-sm text-slate-500">No expenses yet.</p>
            ) : (
              group.expenses.slice(0, 8).map((expense) => (
                <div key={expense.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{expense.title}</p>
                      <p className="text-sm text-slate-500">
                        Paid by {expense.paidBy.name} · {expense.splitType.toLowerCase()}
                      </p>
                    </div>
                    <p className="font-mono font-semibold text-slate-900">{formatPaise(expense.totalAmount)}</p>
                  </div>
                  <form action={deleteExpense.bind(null, group.id, expense.id)} className="mt-2">
                    <button type="submit" className="text-xs font-medium text-rose-600 hover:text-rose-700">
                      Delete
                    </button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <form action={leaveGroup.bind(null, group.id)} className="pb-10">
        <button type="submit" className="text-sm font-medium text-slate-400 transition hover:text-rose-600">
          Leave group
        </button>
      </form>
    </main>
  );
}
