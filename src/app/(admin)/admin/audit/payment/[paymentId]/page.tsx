import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentAuditClient } from '@/components/admin/audit/PaymentAuditClient';

export const metadata = { title: 'Payment Audit' };

export default async function AdminPaymentAuditPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PaymentAuditClient paymentId={paymentId} />
    </Suspense>
  );
}
