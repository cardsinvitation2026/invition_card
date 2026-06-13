'use client';

import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export function LogoutButton({ variant = 'ghost' }: { variant?: 'ghost' | 'outline' | 'default' }) {
  const { signOut, loading } = useCurrentUser();
  return (
    <Button variant={variant} size="sm" onClick={() => void signOut()} disabled={loading} className="gap-2">
      <LogOut className="size-4" /> Sign out
    </Button>
  );
}
