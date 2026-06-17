'use client';

import type { PaymentStatus } from '@/types/payment';
import type { MembershipStatus } from '@/types/membership-engine';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case 'SUCCESS':
      return <AdminStatusBadge label="SUCCESS" variant="success" />;
    case 'FAILED':
      return <AdminStatusBadge label="FAILED" variant="destructive" />;
    case 'REFUNDED':
      return <AdminStatusBadge label="REFUNDED" variant="muted" />;
    default:
      return <AdminStatusBadge label="PENDING" variant="warning" />;
  }
}

export function MembershipStatusBadge({ status }: { status: MembershipStatus }) {
  switch (status) {
    case 'ACTIVE':
      return <AdminStatusBadge label="ACTIVE" variant="success" />;
    case 'EXPIRED':
      return <AdminStatusBadge label="EXPIRED" variant="muted" />;
    case 'CANCELLED':
      return <AdminStatusBadge label="CANCELLED" variant="destructive" />;
    default:
      return <AdminStatusBadge label={status} variant="muted" />;
  }
}

export function truncatePaymentId(id: string): string {
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function displayUserLabel(name: string | null, email: string): string {
  return name?.trim() ? name : email;
}

export function formatDownloadLimit(limit: number | null | undefined): string {
  if (limit === null || limit === undefined) {
    return 'Unlimited';
  }
  return String(limit);
}
