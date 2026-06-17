import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { MembershipsListClient } from '@/components/admin/lists/MembershipsListClient';

export const metadata = { title: 'Memberships' };

export default function AdminMembershipsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <MembershipsListClient />
    </Suspense>
  );
}
