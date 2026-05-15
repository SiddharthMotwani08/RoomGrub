import { notFound } from 'next/navigation';
import NavBarContainer from '@/components/NavBarContainer';
import { LoginRequired } from '@/policies/LoginRequired';
import { validRoom } from '@/policies/validRoom';

const SKIP_SEGMENTS = new Set(['manifest.webmanifest', 'favicon.ico', 'robots.txt', 'sitemap.xml']);

export default async function RoomLayout({ children, params }) {
  const { room_id } = await params;
  const id = String(room_id);
  if (SKIP_SEGMENTS.has(id) || !/^\d+$/.test(id)) notFound();

  await LoginRequired();
  await validRoom({ params });
  return <NavBarContainer>{children}</NavBarContainer>;
}
