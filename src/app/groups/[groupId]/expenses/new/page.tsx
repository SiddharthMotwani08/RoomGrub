import Link from 'next/link';
import { SplitType } from '@prisma/client';
import { findGroupForActiveMember } from '@/lib/groups';
import { requireUser } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addExpense } from '../../actions';

export default async function NewExpensePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await findGroupForActiveMember(user.id, groupId, {
    members: {
      where: { active: true },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: 'asc' },
    },
  });

  return (
    <main className="pocket-shell mx-auto min-h-screen w-full max-w-2xl px-4 py-8">
      <Link href={`/groups/${group.id}`} className="text-sm font-medium text-emerald-900/80 hover:text-emerald-950">
        ← Back to {group.name}
      </Link>

      <Card className="pocket-card mt-6 border-emerald-100/50 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Add expense</CardTitle>
          <CardDescription>Amount first. Pick participants. Unequal splits must match total exactly.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addExpense.bind(null, group.id)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="totalAmount">Total amount</Label>
                <Input id="totalAmount" name="totalAmount" inputMode="decimal" placeholder="1200.00" required autoFocus />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Dinner" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidById">Paid by</Label>
              <select id="paidById" name="paidById" defaultValue={user.id} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                {group.members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="splitType">Split type</Label>
              <select id="splitType" name="splitType" defaultValue={SplitType.EQUAL} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm">
                <option value={SplitType.EQUAL}>Equal</option>
                <option value={SplitType.UNEQUAL}>Unequal</option>
              </select>
              <p className="text-xs text-slate-500">For unequal split, fill amounts below. For equal split, amounts are ignored.</p>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-slate-700">Participants</legend>
              {group.members.map((member) => (
                <div key={member.user.id} className="grid gap-3 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1fr_160px] sm:items-center">
                  <label className="flex items-center gap-3 text-sm font-medium">
                    <input type="checkbox" name="participants" value={member.user.id} defaultChecked className="h-4 w-4 rounded border-slate-300" />
                    {member.user.name}
                  </label>
                  <Input name={`split-${member.user.id}`} inputMode="decimal" placeholder="Unequal amount" />
                </div>
              ))}
            </fieldset>

            <Button className="w-full">Add expense</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
