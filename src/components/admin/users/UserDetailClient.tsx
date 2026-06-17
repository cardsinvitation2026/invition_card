'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { UserRoleBadge } from '@/components/admin/users/user-ui';
import { MembershipStatusBadge, formatDownloadLimit } from '@/components/admin/payments/payment-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import { formatAdminDateTime } from '@/lib/admin/render-job-format';
import { formatAccountPrice } from '@/lib/account/format';
import type { AdminUserDetail } from '@/types/admin-user';

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

function ActivityList<T extends { id: string }>({
  items,
  emptyLabel,
  renderItem,
}: {
  items: T[];
  emptyLabel: string;
  renderItem: (item: T) => ReactNode;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="divide-y rounded-md border">
      {items.map((item) => (
        <li key={item.id} className="px-4 py-3 text-sm">
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

export function UserDetailClient({ userId }: { userId: string }) {
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AdminUserDetail>(`/api/admin/users/${userId}`);
      setUser(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load user');
    } finally {
      setLoading(false);
    }
  }, [userId]);

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

  if (!user) {
    return <ErrorState title="User not found" description="This user may have been removed." />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="User details"
        description={user.email}
        actions={
          <Button asChild variant="outline">
            <Link href={adminRoutes.users}>Back to list</Link>
          </Button>
        }
      />

      <AdminSectionCard title="User information">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label="User ID"
            value={<code className="font-mono text-xs">{user.id}</code>}
          />
          <DetailField label="Name" value={user.name ?? '—'} />
          <DetailField label="Email" value={user.email} />
          <DetailField label="Role" value={<UserRoleBadge role={user.role} />} />
          <DetailField label="Created" value={formatAdminDateTime(user.createdAt)} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Membership summary">
        {user.activeMemberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active memberships.</p>
        ) : (
          <div className="space-y-4">
            {user.activeMemberships.map((membership) => (
              <div
                key={membership.id}
                className="grid gap-4 rounded-md border p-4 sm:grid-cols-2"
              >
                <DetailField label="Plan name" value={membership.planName} />
                <DetailField
                  label="Status"
                  value={
                    <MembershipStatusBadge
                      status={
                        membership.status as 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
                      }
                    />
                  }
                />
                <DetailField
                  label="Start date"
                  value={formatAdminDateTime(membership.startDate)}
                />
                <DetailField
                  label="End date"
                  value={formatAdminDateTime(membership.endDate)}
                />
                <DetailField label="Downloads used" value={membership.downloadsUsed} />
                <DetailField
                  label="Download limit"
                  value={formatDownloadLimit(membership.downloadLimit)}
                />
              </div>
            ))}
          </div>
        )}
      </AdminSectionCard>

      <AdminSectionCard title="Purchase summary">
        <div className="grid gap-4 sm:grid-cols-3">
          <DetailField
            label="Total purchases"
            value={user.purchaseSummary.totalPurchases}
          />
          <DetailField
            label="Successful purchases"
            value={user.purchaseSummary.successfulPurchases}
          />
          <DetailField
            label="Lifetime spend"
            value={formatAccountPrice(user.purchaseSummary.lifetimeSpend, 'INR')}
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Activity summary">
        <div className="grid gap-4 sm:grid-cols-3">
          <DetailField label="Draft count" value={user.activitySummary.draftCount} />
          <DetailField label="Render count" value={user.activitySummary.renderCount} />
          <DetailField label="Download count" value={user.activitySummary.downloadCount} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Recent activity">
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">Drafts</p>
            <ActivityList
              items={user.recentDrafts}
              emptyLabel="No drafts yet."
              renderItem={(draft) => (
                <div className="flex items-center justify-between gap-2">
                  <span>{draft.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatAdminDateTime(draft.createdAt)}
                  </span>
                </div>
              )}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Renders</p>
            <ActivityList
              items={user.recentRenders}
              emptyLabel="No renders yet."
              renderItem={(render) => (
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-xs">{render.id}</code>
                  <span className="text-xs text-muted-foreground">
                    {render.status} · {formatAdminDateTime(render.createdAt)}
                  </span>
                </div>
              )}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Downloads</p>
            <ActivityList
              items={user.recentDownloads}
              emptyLabel="No downloads yet."
              renderItem={(download) => (
                <div className="flex items-center justify-between gap-2">
                  <span>{download.downloadType ?? 'Download'}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatAdminDateTime(download.downloadedAt)}
                  </span>
                </div>
              )}
            />
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}
