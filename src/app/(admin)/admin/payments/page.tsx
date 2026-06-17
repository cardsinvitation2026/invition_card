import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentsListClient } from '@/components/admin/lists/PaymentsListClient';

export const metadata = { title: 'Payments & Revenue' };

export default function AdminPaymentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PaymentsListClient />
    </Suspense>
  );
}
