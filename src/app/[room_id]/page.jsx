import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { fetchRoomDashboard } from './actions';
import RoomDashboardPage from './_components/RoomDashboardPage';

export default async function Page({ params }) {
  const session = await auth();
  const { room_id } = await params;
  if (!session?.user) redirect('/login');

  const firstName =
    session.user.name?.split(' ')?.[0] ||
    session.user.user_metadata?.full_name?.split(' ')?.[0] ||
    'there';
  const { totalRoomStats, memberStats } = await fetchRoomDashboard(room_id);

  return <RoomDashboardPage firstName={firstName} totalRoomStats={totalRoomStats} memberStats={memberStats} />;
}
