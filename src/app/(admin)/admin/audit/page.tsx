import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditOverviewClient } from '@/components/admin/audit/AuditOverviewClient';

export const metadata = { title: 'Audit' };

export default function AdminAuditPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <AuditOverviewClient />
    </Suspense>
  );
}
