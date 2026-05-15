import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createGroup, joinGroup } from './groups/actions';

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const memberships = await db.groupMember.findMany({
    where: { userId: session.user.id, active: true },
    include: {
      group: {
        include: {
          members: { where: { active: true } },
        },
      },
    },
    orderBy: { joinedAt: 'desc' },
  });

  return (
    <main className="pocket-shell mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-800/90">Pocket</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Hi {session.user.name ?? 'there'}
          </h1>
          <p className="mt-2 max-w-md text-slate-600">
            Shared ledger for flatmates — balances stay accurate in paise, settle in fewest transfers.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200/90 bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-rose-200 hover:bg-rose-50/80 hover:text-rose-800"
          href="/api/auth/signout"
        >
          Sign out
        </Link>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {memberships.length === 0 ? (
            <Card className="pocket-card border-dashed border-emerald-200/60 bg-emerald-50/20">
              <CardHeader>
                <CardTitle>No groups yet</CardTitle>
                <CardDescription>
                  Create one on the right or ask mates for invite code — everyone stays on same math.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            memberships.map(({ group }) => (
              <Link href={`/groups/${group.id}`} key={group.id} className="block">
                <Card className="pocket-card border-emerald-100/40 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-900/10">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">{group.name}</CardTitle>
                      <CardDescription className="mt-2 font-mono text-xs">
                        {group.members.length} members · {group.inviteCode}
                      </CardDescription>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                      Open
                    </span>
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>

        <aside className="space-y-4">
          <Card className="pocket-card border-emerald-100/50 shadow-lg shadow-slate-900/5">
            <CardHeader>
              <CardTitle>New group</CardTitle>
              <CardDescription>Name it anything — get invite code instantly.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={createGroup} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="name">Group name</Label>
                  <Input id="name" name="name" placeholder="Flatmates" required />
                </div>
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 shadow-md shadow-emerald-900/15 hover:from-emerald-500 hover:to-teal-500">
                  Create group
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="pocket-card border-slate-200/80">
            <CardHeader>
              <CardTitle>Join group</CardTitle>
              <CardDescription>Paste code mates sent you.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={joinGroup} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invite code</Label>
                  <Input id="inviteCode" name="inviteCode" placeholder="e.g. FLATMATES" />
                </div>
                <Button className="w-full" variant="outline">
                  Join
                </Button>
              </form>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
