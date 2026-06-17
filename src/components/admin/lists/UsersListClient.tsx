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
import { AdminUserSummaryCards } from '@/components/admin/users/AdminUserSummaryCards';
import { displayUserName, UserRoleBadge } from '@/components/admin/users/user-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import { formatAdminDateTime } from '@/lib/admin/render-job-format';
import { formatAccountPrice } from '@/lib/account/format';
import type { AdminUserListItem, AdminUserListResult } from '@/types/admin-user';

const ROLE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'USER', label: 'User' },
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
] as const;

const MEMBERSHIP_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'has_active', label: 'Has Active Membership' },
  { value: 'no_active', label: 'No Active Membership' },
] as const;

export function UsersListClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AdminUserListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const search = searchParams.get('search') ?? '';
  const role = searchParams.get('role') ?? 'all';
  const membership = searchParams.get('membership') ?? 'all';
  const page = Number(searchParams.get('page') ?? '1');

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === 'all') params.delete(k);
        else params.set(k, v);
      });
      router.push(`${adminRoutes.users}?${params.toString()}`);
    },
    [router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set('search', search);
      if (role !== 'all') qs.set('role', role);
      if (membership !== 'all') qs.set('membership', membership);
      qs.set('page', String(page));
      qs.set('pageSize', '20');
      const res = await adminFetch<AdminUserListResult>(`/api/admin/users?${qs.toString()}`);
      setResult(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [search, role, membership, page]);

  useEffect(() => {
    void load();
  }, [load]);

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
        title="Users"
        description="Monitor user activity, memberships, purchases, renders, drafts, and downloads."
      />

      <AdminUserSummaryCards summary={result?.summary ?? null} />

      <AdminFilters>
        <AdminSearch
          value={search}
          onChange={(value) => updateParams({ search: value || null, page: '1' })}
          placeholder="Search name or email…"
        />
        <Select value={role} onValueChange={(value) => updateParams({ role: value, page: '1' })}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={membership}
          onValueChange={(value) => updateParams({ membership: value, page: '1' })}
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Membership" />
          </SelectTrigger>
          <SelectContent>
            {MEMBERSHIP_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminFilters>

      {items.length === 0 ? (
        <AdminEmptyState title="No users found" />
      ) : (
        <>
          <AdminTable
            rows={items}
            columns={[
              {
                key: 'user',
                header: 'User',
                cell: (row: AdminUserListItem) => (
                  <div>
                    <p className="font-medium">{displayUserName(row.name, row.email)}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </div>
                ),
              },
              {
                key: 'role',
                header: 'Role',
                cell: (row) => <UserRoleBadge role={row.role} />,
              },
              {
                key: 'memberships',
                header: 'Memberships',
                cell: (row) => row.activeMembershipCount,
              },
              {
                key: 'drafts',
                header: 'Drafts',
                cell: (row) => row.draftCount,
              },
              {
                key: 'renders',
                header: 'Renders',
                cell: (row) => row.renderCount,
              },
              {
                key: 'downloads',
                header: 'Downloads',
                cell: (row) => row.downloadCount,
              },
              {
                key: 'lifetimeSpend',
                header: 'Lifetime Spend',
                cell: (row) => formatAccountPrice(row.lifetimeSpend, 'INR'),
              },
              {
                key: 'created',
                header: 'Created',
                cell: (row) => formatAdminDateTime(row.createdAt),
              },
              {
                key: 'actions',
                header: 'Actions',
                className: 'text-right',
                cell: (row) => (
                  <Button asChild variant="outline" size="sm">
                    <Link href={adminRoutes.userDetail(row.id)}>
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
                    <p className="font-medium">{displayUserName(row.name, row.email)}</p>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </div>
                  <UserRoleBadge role={row.role} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p>Memberships: {row.activeMembershipCount}</p>
                  <p>Drafts: {row.draftCount}</p>
                  <p>Renders: {row.renderCount}</p>
                  <p>Downloads: {row.downloadCount}</p>
                </div>
                <p className="text-sm font-medium">
                  {formatAccountPrice(row.lifetimeSpend, 'INR')} lifetime spend
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatAdminDateTime(row.createdAt)}
                </p>
                <Button asChild size="sm" variant="outline">
                  <Link href={adminRoutes.userDetail(row.id)}>View</Link>
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
