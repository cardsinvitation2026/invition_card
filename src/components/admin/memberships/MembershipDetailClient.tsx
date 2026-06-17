'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import {
  formatDownloadLimit,
  formatRemainingDownloads,
} from '@/components/admin/memberships/membership-ui';
import { MembershipStatusBadge } from '@/components/admin/payments/payment-ui';
import { UserRoleBadge } from '@/components/admin/users/user-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import { formatAdminDateTime } from '@/lib/admin/render-job-format';
import { formatAccountPrice } from '@/lib/account/format';
import type { AdminMembershipDetail } from '@/types/admin-membership';

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

export function MembershipDetailClient({ membershipId }: { membershipId: string }) {
  const [membership, setMembership] = useState<AdminMembershipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AdminMembershipDetail>(
        `/api/admin/memberships/${membershipId}`,
      );
      setMembership(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load membership');
    } finally {
      setLoading(false);
    }
  }, [membershipId]);

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

  if (!membership) {
    return (
      <ErrorState
        title="Membership not found"
        description="This membership may have been removed."
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Membership details"
        description={`${membership.planName} · ${membership.userEmail}`}
        actions={
          <Button asChild variant="outline">
            <Link href={adminRoutes.memberships}>Back to list</Link>
          </Button>
        }
      />

      <AdminSectionCard title="Membership information">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField
            label="Membership ID"
            value={<code className="font-mono text-xs">{membership.id}</code>}
          />
          <DetailField
            label="Status"
            value={<MembershipStatusBadge status={membership.status} />}
          />
          <DetailField label="Start date" value={formatAdminDateTime(membership.startDate)} />
          <DetailField label="End date" value={formatAdminDateTime(membership.endDate)} />
          <DetailField label="Created date" value={formatAdminDateTime(membership.createdAt)} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="User information">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Name" value={membership.userName ?? '—'} />
          <DetailField label="Email" value={membership.userEmail} />
          <DetailField
            label="Role"
            value={
              <UserRoleBadge role={membership.userRole as 'USER' | 'SUPER_ADMIN'} />
            }
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Plan information">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Plan name" value={membership.planName} />
          <DetailField
            label="Price"
            value={formatAccountPrice(membership.planPrice, membership.planCurrency)}
          />
          <DetailField label="Currency" value={membership.planCurrency} />
          <DetailField label="Validity days" value={membership.planValidityDays} />
          <DetailField
            label="Download limit"
            value={formatDownloadLimit(membership.planDownloadLimit)}
          />
          <DetailField label="Description" value={membership.planDescription ?? '—'} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Quota usage">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Downloads used" value={membership.downloadsUsed} />
          <DetailField
            label="Download limit"
            value={formatDownloadLimit(membership.downloadLimit)}
          />
          <DetailField
            label="Remaining downloads"
            value={formatRemainingDownloads(
              membership.downloadLimit,
              membership.remainingLabel,
            )}
          />
          <DetailField
            label="Usage percentage"
            value={
              membership.usagePercentage === null
                ? 'Unlimited'
                : `${membership.usagePercentage}%`
            }
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Recent download activity">
        {membership.recentDownloads.length === 0 ? (
          <p className="text-sm text-muted-foreground">No download activity yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {membership.recentDownloads.map((log) => (
              <li key={log.id} className="space-y-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">
                    {log.downloadType ?? 'Download'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatAdminDateTime(log.downloadedAt)}
                  </span>
                </div>
                <p className="text-muted-foreground">
                  Draft: {log.draftTitle ?? log.draftId}
                  {log.templateName ? ` · ${log.templateName}` : ''}
                </p>
                {log.fileUrl ? (
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {log.fileUrl}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </AdminSectionCard>
    </div>
  );
}
