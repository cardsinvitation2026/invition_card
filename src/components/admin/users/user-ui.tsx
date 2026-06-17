'use client';

import type { UserRole } from '@/types/user';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';

export function UserRoleBadge({ role }: { role: UserRole }) {
  switch (role) {
    case 'SUPER_ADMIN':
      return <AdminStatusBadge label="SUPER_ADMIN" variant="warning" />;
    default:
      return <AdminStatusBadge label="USER" variant="muted" />;
  }
}

export function displayUserName(name: string | null, email: string): string {
  return name?.trim() ? name : email;
}
