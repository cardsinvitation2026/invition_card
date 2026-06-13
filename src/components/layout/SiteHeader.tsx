'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LogoutButton } from '@/components/auth/LogoutButton';

export function SiteHeader() {
  const { user, isAuthenticated, isSuperAdmin, loading, devModeEnabled } = useCurrentUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Sparkles className="size-4 text-primary" />
          <span>My Invitations</span>
          {devModeEnabled && (
            <Badge variant="outline" className="ml-2 border-amber-400 text-amber-600 dark:text-amber-300">
              dev mode
            </Badge>
          )}
        </Link>
        <nav className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <Avatar className="size-7">
                {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.email} /> : null}
                <AvatarFallback>{(user.name ?? user.email).slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.name ?? user.email}
              </span>
              {isSuperAdmin && (
                <Badge className="border-primary/30" variant="outline">
                  admin
                </Badge>
              )}
              <LogoutButton />
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
