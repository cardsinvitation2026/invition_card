'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import {
  MembershipStatusBadge,
  PaymentStatusBadge,
  formatDownloadLimit,
} from '@/components/admin/payments/payment-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import { formatAdminDateTime } from '@/lib/admin/render-job-format';
import { formatAccountPrice } from '@/lib/account/format';
import type { AdminPaymentDetail } from '@/types/admin-payment';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function PaymentDetailClient({ paymentId }: { paymentId: string }) {
  const [payment, setPayment] = useState<AdminPaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AdminPaymentDetail>(`/api/admin/payments/${paymentId}`);
      setPayment(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payment');
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (!payment) {
    return <ErrorState title="Payment not found" description="This payment may have been removed." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Payment details"
        description={
          payment.razorpayPaymentId
            ? `Payment ${payment.razorpayPaymentId}`
            : `Payment ${payment.id}`
        }
        actions={
          <Button asChild variant="outline">
            <Link href={adminRoutes.payments}>Back to list</Link>
          </Button>
        }
      />

      <AdminSectionCard title="Payment information">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label="Payment ID"
            value={
              payment.razorpayPaymentId ? (
                <code className="font-mono text-xs">{payment.razorpayPaymentId}</code>
              ) : (
                '—'
              )
            }
          />
          <DetailField
            label="Order ID"
            value={<code className="font-mono text-xs">{payment.orderId}</code>}
          />
          <DetailField label="Status" value={<PaymentStatusBadge status={payment.status} />} />
          <DetailField
            label="Amount"
            value={formatAccountPrice(payment.amount, payment.currency)}
          />
          <DetailField label="Currency" value={payment.currency} />
          <DetailField label="Created" value={formatAdminDateTime(payment.createdAt)} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="User">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Name" value={payment.userName ?? '—'} />
          <DetailField label="Email" value={payment.userEmail} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Membership plan">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Plan name" value={payment.planName ?? '—'} />
          <DetailField
            label="Price"
            value={
              payment.planPrice !== null
                ? formatAccountPrice(payment.planPrice, payment.currency)
                : '—'
            }
          />
          <DetailField
            label="Validity days"
            value={payment.planValidityDays ?? '—'}
          />
          <DetailField
            label="Download limit"
            value={formatDownloadLimit(payment.planDownloadLimit)}
          />
        </div>
      </AdminSectionCard>

      {payment.membershipId && (
        <AdminSectionCard title="Membership">
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailField
              label="Membership ID"
              value={<code className="font-mono text-xs">{payment.membershipId}</code>}
            />
            <DetailField
              label="Status"
              value={
                payment.membershipStatus ? (
                  <MembershipStatusBadge
                    status={
                      payment.membershipStatus as 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
                    }
                  />
                ) : (
                  '—'
                )
              }
            />
            <DetailField
              label="Start date"
              value={
                payment.membershipStartDate
                  ? formatAdminDateTime(payment.membershipStartDate)
                  : '—'
              }
            />
            <DetailField
              label="End date"
              value={
                payment.membershipEndDate
                  ? formatAdminDateTime(payment.membershipEndDate)
                  : '—'
              }
            />
          </div>
        </AdminSectionCard>
      )}

      <AdminSectionCard title="Razorpay">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label="Razorpay order ID"
            value={
              payment.razorpayOrderId ? (
                <code className="font-mono text-xs">{payment.razorpayOrderId}</code>
              ) : (
                '—'
              )
            }
          />
          <DetailField
            label="Razorpay payment ID"
            value={
              payment.razorpayPaymentId ? (
                <code className="font-mono text-xs">{payment.razorpayPaymentId}</code>
              ) : (
                '—'
              )
            }
          />
        </div>
      </AdminSectionCard>
    </div>
  );
}
