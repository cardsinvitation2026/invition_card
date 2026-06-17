import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerAuditClient } from '@/components/admin/audit/CustomerAuditClient';

export const metadata = { title: 'Customer Audit' };

export default async function AdminCustomerAuditPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <CustomerAuditClient userId={userId} />
    </Suspense>
  );
}
