'use client';

import { useRouter } from 'next/navigation';

import { createClient } from '@/lib/supabase/client';

export function SignOutButton() {
  const router = useRouter();

  const onSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/auth');
    router.refresh();
  };

  return (
    <button className="ghost-button" onClick={onSignOut} type="button">
      Sign out
    </button>
  );
}
