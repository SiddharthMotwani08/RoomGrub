import Link from 'next/link';
import { findGroupForActiveMember } from '@/lib/groups';
import { requireUser } from '@/lib/session';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function ActivityPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  const user = await requireUser();

  const group = await findGroupForActiveMember(user.id, groupId, {
    activities: {
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    },
  });

  return (
    <main className="pocket-shell mx-auto min-h-screen w-full max-w-3xl px-4 py-8">
      <Link href={`/groups/${group.id}`} className="text-sm font-medium text-emerald-900/80 hover:text-emerald-950">
        ← Back to {group.name}
      </Link>

      <Card className="pocket-card mt-6 border-emerald-100/50 shadow-lg shadow-slate-900/5">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Expenses, settlements, and membership changes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {group.activities.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            group.activities.map((activity) => (
              <div key={activity.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">{activity.message}</p>
                  <Badge>{activity.type.toLowerCase().replaceAll('_', ' ')}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {activity.user?.name ?? 'System'} · {activity.createdAt.toLocaleString('en-IN')}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}
