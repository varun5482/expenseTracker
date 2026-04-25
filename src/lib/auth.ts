import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/db-types';

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth');
  }
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, username, created_at, updated_at')
    .eq('id', user.id)
    .single();

  return (data as Profile | null) ?? null;
}
