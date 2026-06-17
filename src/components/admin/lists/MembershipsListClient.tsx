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
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSearch } from '@/components/admin/AdminSearch';
import { AdminFilters } from '@/components/admin/AdminFilters';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminMembershipSummaryCards } from '@/components/admin/memberships/AdminMembershipSummaryCards';
import {
  displayUserLabel,
  formatDownloadLimit,
  formatRemainingDownloads,
} from '@/components/admin/memberships/membership-ui';
import { MembershipStatusBadge } from '@/components/admin/payments/payment-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import { formatAdminDateTime } from '@/lib/admin/render-job-format';
import type { AdminMembershipListItem, AdminMembershipListResult } from '@/types/admin-membership';
import type { MembershipPlanListItem } from '@/types/membership-plan';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELLED', label: 'Cancelled' },
] as const;

export function MembershipsListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AdminMembershipListResult | null>(null);
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
      router.push(`${adminRoutes.memberships}?${params.toString()}`);
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
      const res = await adminFetch<AdminMembershipListResult>(
        `/api/admin/memberships?${qs.toString()}`,
      );
      setResult(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load memberships');
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Memberships"
        description="Monitor active, expired, cancelled memberships and download quota consumption."
      />

      <AdminMembershipSummaryCards summary={result?.summary ?? null} />

      <AdminFilters>
        <AdminSearch
          value={search}
          onChange={(value) => updateParams({ search: value || null, page: '1' })}
          placeholder="Search name or email…"
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
        <AdminEmptyState title="No memberships found" />
      ) : (
        <>
          <AdminTable
            rows={items}
            columns={[
              {
                key: 'user',
                header: 'User',
                cell: (row: AdminMembershipListItem) => (
                  <div>
                    <p className="font-medium">{displayUserLabel(row.userName, row.userEmail)}</p>
                    <p className="text-xs text-muted-foreground">{row.userEmail}</p>
                  </div>
                ),
              },
              {
                key: 'plan',
                header: 'Plan',
                cell: (row) => row.planName,
              },
              {
                key: 'status',
                header: 'Status',
                cell: (row) => <MembershipStatusBadge status={row.status} />,
              },
              {
                key: 'downloadsUsed',
                header: 'Downloads Used',
                cell: (row) => row.downloadsUsed,
              },
              {
                key: 'downloadLimit',
                header: 'Download Limit',
                cell: (row) => formatDownloadLimit(row.downloadLimit),
              },
              {
                key: 'remaining',
                header: 'Remaining',
                cell: (row) =>
                  formatRemainingDownloads(row.downloadLimit, row.remainingLabel),
              },
              {
                key: 'startDate',
                header: 'Start Date',
                cell: (row) => formatAdminDateTime(row.startDate),
              },
              {
                key: 'endDate',
                header: 'End Date',
                cell: (row) => formatAdminDateTime(row.endDate),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                cell: (row) => (
                  <Button asChild variant="outline" size="sm">
                    <Link href={adminRoutes.membershipDetail(row.id)}>
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
                    <p className="font-medium">{displayUserLabel(row.userName, row.userEmail)}</p>
                    <p className="text-xs text-muted-foreground">{row.planName}</p>
                  </div>
                  <MembershipStatusBadge status={row.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Used: {row.downloadsUsed}</p>
                  <p>Limit: {formatDownloadLimit(row.downloadLimit)}</p>
                  <p>
                    Remaining:{' '}
                    {formatRemainingDownloads(row.downloadLimit, row.remainingLabel)}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAdminDateTime(row.startDate)} – {formatAdminDateTime(row.endDate)}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={adminRoutes.membershipDetail(row.id)}>View</Link>
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
  );
}
