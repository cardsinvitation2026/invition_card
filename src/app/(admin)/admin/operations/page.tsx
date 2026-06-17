import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { OperationsDashboardClient } from '@/components/admin/operations/OperationsDashboardClient';

export const metadata = { title: 'Operations' };

export default function AdminOperationsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <OperationsDashboardClient />
    </Suspense>
  );
}
