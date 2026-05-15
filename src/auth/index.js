import 'server-only';

import { cache } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/** NextAuth session for Pocket + legacy pages (email on `session.user.email`). */
export const auth = cache(async () => getServerSession(authOptions));

function hasSupabase() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Legacy RoomGrub — needs Supabase REST + same Postgres as old `Users` / `UserRooms` tables. */
export const getUserRooms = cache(async (email) => {
  if (!hasSupabase()) {
    return { data: null, error: 'Legacy Supabase not configured' };
  }
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  const { data: userRecord, error: userError } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .single();
  if (userError || !userRecord) return { data: null, error: userError || 'User not found' };

  const { data, error } = await supabase
    .from('UserRooms')
    .select('room_id, role, joined_at, Rooms(id, admin, members, budget)')
    .eq('user_id', userRecord.id);
  return { data, error };
});

export const getUserRoomForRoom = cache(async (email, roomId) => {
  if (!hasSupabase()) {
    return { data: null, error: 'Legacy Supabase not configured' };
  }
  const { createClient } = await import('@/utils/supabase/server');
  const supabase = await createClient();
  const { data: userRecord, error: userError } = await supabase
    .from('Users')
    .select('id')
    .eq('email', email)
    .single();
  if (userError || !userRecord) return { data: null, error: userError || 'User not found' };

  const { data, error } = await supabase
    .from('UserRooms')
    .select('room_id, role')
    .eq('user_id', userRecord.id)
    .eq('room_id', parseInt(roomId, 10))
    .single();
  return { data, error };
});
