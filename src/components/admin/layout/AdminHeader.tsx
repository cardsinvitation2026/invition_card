'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';

export function AdminHeader() {
  const { user } = useCurrentUser();
  const initials = user?.name?.slice(0, 2).toUpperCase() ?? user?.email?.slice(0, 2).toUpperCase() ?? 'AD';

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold md:text-base">Administration</p>
          <div className="hidden sm:block">
            <AdminBreadcrumbs />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-none">{user?.name ?? 'Super Admin'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <LogoutButton variant="outline" />
        </div>
      </div>
      <div className="border-t px-4 py-2 sm:hidden">
        <AdminBreadcrumbs />
      </div>
    </header>
  );
}
