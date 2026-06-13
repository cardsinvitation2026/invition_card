'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { primaryNav } from '@/config/navigation';

export function SiteHeader() {
  const { user, isAuthenticated, isSuperAdmin, loading, devModeEnabled } = useCurrentUser();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Sparkles className="size-5 text-primary" />
            <span>My Invitations</span>
            {devModeEnabled && (
              <Badge variant="outline" className="ml-2 border-amber-400 text-amber-600 dark:text-amber-300">
                dev mode
              </Badge>
            )}
          </Link>
          <nav className="hidden gap-1 md:flex">
            {primaryNav.map((item) => (
              <Button asChild key={item.href} variant="ghost" size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-muted" />
          ) : isAuthenticated && user ? (
            <div className="hidden items-center gap-2 md:flex">
              <Avatar className="size-8">
                {user.photoUrl ? <AvatarImage src={user.photoUrl} alt={user.email} /> : null}
                <AvatarFallback>{(user.name ?? user.email).slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              {isSuperAdmin && <Badge variant="outline">admin</Badge>}
              <LogoutButton />
            </div>
          ) : (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1">
                {primaryNav.map((item) => (
                  <Button asChild key={item.href} variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
                <div className="my-2 border-t" />
                <LanguageSwitcher />
                <div className="mt-3">
                  {isAuthenticated ? (
                    <LogoutButton variant="outline" />
                  ) : (
                    <Button asChild className="w-full" onClick={() => setOpen(false)}>
                      <Link href="/login">Sign in</Link>
                    </Button>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="sr-only">
                  <X /> close
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
