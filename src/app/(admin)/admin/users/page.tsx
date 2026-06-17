import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UsersListClient } from '@/components/admin/lists/UsersListClient';

export const metadata = { title: 'Users' };

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <UsersListClient />
    </Suspense>
  );
}
