import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentDetailClient } from '@/components/admin/payments/PaymentDetailClient';

export const metadata = { title: 'Payment Details' };

export default async function AdminPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <PaymentDetailClient paymentId={id} />
    </Suspense>
  );
}
