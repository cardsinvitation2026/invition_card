// Client-side render guard. Server-side middleware is the real enforcer;
// this exists to render gentle UX (loading + redirect) inside the React tree.
'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { UserRole } from '@/types/user';

interface AuthGuardProps {
  children: ReactNode;
  requireRole?: UserRole;
  redirectTo?: string;
}

export function AuthGuard({ children, requireRole, redirectTo = '/login' }: AuthGuardProps) {
  const { user, loading, isAuthenticated, isSuperAdmin } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }
    if (requireRole === 'SUPER_ADMIN' && !isSuperAdmin) {
      router.replace('/');
    }
  }, [loading, isAuthenticated, isSuperAdmin, requireRole, redirectTo, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (requireRole === 'SUPER_ADMIN' && !isSuperAdmin) return null;
  return <>{children}</>;
}
