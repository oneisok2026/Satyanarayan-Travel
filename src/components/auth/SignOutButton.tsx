'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Button } from '@/components/ui/Button';

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    await signOut();
    router.replace('/');
    // Server Components must re-render without the session cookie.
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      fullWidth
      loading={loading}
      onClick={handleSignOut}
      className={className}
    >
      Sign out
    </Button>
  );
}
