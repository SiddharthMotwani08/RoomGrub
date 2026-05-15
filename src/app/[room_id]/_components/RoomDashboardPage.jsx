import WelCome from './WelCome';
import HomeDashboard from './HomeDashboard';

export default function RoomDashboardPage({ firstName, totalRoomStats, memberStats }) {
  return (
    <div className="px-2 py-1">
      <WelCome firstName={firstName} />
      {totalRoomStats && (
        <HomeDashboard totalRoomStats={totalRoomStats} memberStats={memberStats} />
      )}
    </div>
  );
}
