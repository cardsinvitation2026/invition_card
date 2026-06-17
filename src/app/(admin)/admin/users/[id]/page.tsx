import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDetailClient } from '@/components/admin/users/UserDetailClient';

export const metadata = { title: 'User Details' };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <UserDetailClient userId={id} />
    </Suspense>
  );
}
