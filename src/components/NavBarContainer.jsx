import 'server-only';
import NavBar from './NavBar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function NavBarContainer({ children }) {
  const session = await auth();

  async function signOutFn() {
    'use server';
    redirect('/api/auth/signout?callbackUrl=/login');
  }
  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden">
      <NavBar user={session?.user} signOut={signOutFn} />
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>
    </div>
  )
}