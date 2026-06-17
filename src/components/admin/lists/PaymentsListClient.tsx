'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPaymentSummaryCards } from '@/components/admin/payments/AdminPaymentSummaryCards';
import {
  displayUserLabel,
  MembershipStatusBadge,
  PaymentStatusBadge,
  truncatePaymentId,
} from '@/components/admin/payments/payment-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import { formatAdminDateTime } from '@/lib/admin/render-job-format';
import { formatAccountPrice } from '@/lib/account/format';
import type { AdminPaymentListItem, AdminPaymentListResult } from '@/types/admin-payment';
import type { MembershipPlanListItem } from '@/types/membership-plan';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'FAILED', label: 'Failed' },
] as const;

export function PaymentsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AdminPaymentListResult | null>(null);
  const [plans, setPlans] = useState<MembershipPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? 'all';
  const planId = searchParams.get('planId') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === 'all') params.delete(k);
        else params.set(k, v);
      });
      router.push(`${adminRoutes.payments}?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (status !== 'all') qs.set('status', status);
      if (planId !== 'all') qs.set('planId', planId);
      qs.set('page', String(page));
      qs.set('pageSize', '20');
      const res = await adminFetch<AdminPaymentListResult>(
        `/api/admin/payments?${qs.toString()}`,
      );
      setResult(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [search, status, planId, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    adminFetch<{ items: MembershipPlanListItem[] }>(
      '/api/admin/membership-plans?page=1&pageSize=100',
    )
      .then((r) => setPlans(r.data?.items ?? []))
      .catch(() => undefined);
  }, []);

  if (loading && !result) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  const items = result?.items ?? [];

  return (
    <TooltipProvider>
      <AdminPageHeader
        title="Payments & Revenue"
        description="Monitor membership purchases and payment activity."
      />

      <div className="space-y-6">
        <AdminPaymentSummaryCards summary={result?.summary ?? null} />

        <AdminFilters>
          <AdminSearch
            value={search}
            onChange={(value) => updateParams({ search: value || null, page: '1' })}
            placeholder="Search order id, payment id, user…"
          />
          <Select
            value={status}
            onValueChange={(value) => updateParams({ status: value, page: '1' })}
          >
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={planId}
            onValueChange={(value) => updateParams({ planId: value, page: '1' })}
          >
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdminFilters>

        {items.length === 0 ? (
          <AdminEmptyState title="No payments found" />
        ) : (
          <>
            <AdminTable
              rows={items}
              columns={[
                {
                  key: 'orderId',
                  header: 'Order ID',
                  cell: (row: AdminPaymentListItem) => (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                          {truncatePaymentId(row.orderId)}
                        </code>
                      </TooltipTrigger>
                      <TooltipContent>{row.orderId}</TooltipContent>
                    </Tooltip>
                  ),
                },
                {
                  key: 'paymentId',
                  header: 'Payment ID',
                  cell: (row) =>
                    row.razorpayPaymentId ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            {truncatePaymentId(row.razorpayPaymentId)}
                          </code>
                        </TooltipTrigger>
                        <TooltipContent>{row.razorpayPaymentId}</TooltipContent>
                      </Tooltip>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'user',
                  header: 'User',
                  cell: (row) => displayUserLabel(row.userName, row.userEmail),
                },
                {
                  key: 'plan',
                  header: 'Plan',
                  cell: (row) => row.planName ?? '—',
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  cell: (row) => formatAccountPrice(row.amount, row.currency),
                },
                {
                  key: 'status',
                  header: 'Status',
                  cell: (row) => <PaymentStatusBadge status={row.status} />,
                },
                {
                  key: 'created',
                  header: 'Created',
                  cell: (row) => formatAdminDateTime(row.createdAt),
                },
                {
                  key: 'membership',
                  header: 'Membership',
                  cell: (row) =>
                    row.membershipStatus ? (
                      <MembershipStatusBadge
                        status={
                          row.membershipStatus as 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
                        }
                      />
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  className: 'text-right',
                  cell: (row) => (
                    <Button asChild variant="outline" size="sm">
                      <Link href={adminRoutes.paymentDetail(row.id)}>
                        <Eye className="mr-2 size-4" />
                        View
                      </Link>
                    </Button>
                  ),
                },
              ]}
              mobileCard={(row) => (
                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.planName ?? 'No plan'}</p>
                      <code className="font-mono text-xs text-muted-foreground">
                        {truncatePaymentId(row.orderId)}
                      </code>
                    </div>
                    <PaymentStatusBadge status={row.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {displayUserLabel(row.userName, row.userEmail)}
                  </p>
                  <p className="text-sm font-medium">
                    {formatAccountPrice(row.amount, row.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatAdminDateTime(row.createdAt)}
                    {row.membershipStatus ? ` · ${row.membershipStatus}` : ''}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={adminRoutes.paymentDetail(row.id)}>View</Link>
                  </Button>
                </div>
              )}
            />
            <AdminPagination
              page={result?.page ?? 1}
              pageCount={result?.pageCount ?? 1}
              onPageChange={(p) => updateParams({ page: String(p) })}
            />
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
