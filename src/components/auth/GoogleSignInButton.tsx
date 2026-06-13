'use client';

import { Chrome, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

export function GoogleSignInButton({ disabled }: { disabled?: boolean }) {
  const { signInWithGoogle, loading } = useCurrentUser();

  async function handleClick() {
    try {
      await signInWithGoogle();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Sign-in failed');
    }
  }

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      size="lg"
      className="w-full gap-2"
      variant="default"
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Chrome className="size-4" />}
      Continue with Google
    </Button>
  );
}
