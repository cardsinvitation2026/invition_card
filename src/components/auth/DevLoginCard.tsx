'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { toast } from 'sonner';

export function DevLoginCard() {
  const { signInWithDev, loading } = useCurrentUser();
  const [email, setEmail] = useState('demo@myinvitations.test');
  const [name, setName] = useState('Demo User');

  async function handleClick() {
    try {
      await signInWithDev(email, name);
      toast.success(`Signed in as ${email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Dev sign-in failed');
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-4 dark:border-amber-700 dark:bg-amber-950/20">
      <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
        <Sparkles className="size-4" /> Dev mode is on
      </div>
      <p className="text-xs text-muted-foreground">
        No Firebase credentials yet — use this shortcut to sign in instantly for preview.
      </p>
      <div className="space-y-2">
        <Label htmlFor="dev-email" className="text-xs">Email</Label>
        <Input
          id="dev-email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="off"
        />
        <Label htmlFor="dev-name" className="text-xs">Name (optional)</Label>
        <Input
          id="dev-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="off"
        />
      </div>
      <Button
        onClick={handleClick}
        disabled={loading || !email.includes('@')}
        variant="secondary"
        className="w-full gap-2"
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        Continue in dev mode
      </Button>
    </div>
  );
}
