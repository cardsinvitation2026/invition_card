'use client';

import { useEffect, useState, type ComponentType } from 'react';
import Link from 'next/link';
import { FileText, Clapperboard, Download, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AccountStatsGrid } from '@/components/account/AccountStatsGrid';
import { MembershipSummaryCard } from '@/components/account/MembershipSummaryCard';
import { formatAccountDate } from '@/lib/account/format';
import type { ApiResponse } from '@/types/api';
import type { MembershipMeResponse } from '@/types/membership-engine';
import type { DraftListResult } from '@/types/draft';
import type { RenderJobListResult } from '@/types/render-job';
import type { DownloadLogListResult } from '@/types/download-log';
import type {
  DashboardDownloadSummary,
  DashboardDraftSummary,
  DashboardPurchaseSummary,
  DashboardRenderSummary,
  PurchaseHistoryResult,
} from '@/types/account-dashboard';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  const data = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !data.success) {
    throw new Error(data.message ?? 'Request failed');
  }
  return data.data as T;
}

function SummaryStatCard({
  title,
  icon: Icon,
  value,
  detail,
  href,
  emptyLabel,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  value: string | number;
  detail?: string | null;
  href: string;
  emptyLabel?: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="mt-auto space-y-2">
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{detail ?? emptyLabel ?? '—'}</p>
        <Button asChild variant="link" className="h-auto p-0" size="sm">
          <Link href={href}>View details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function AccountDashboardCards() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membership, setMembership] = useState<MembershipMeResponse | null>(null);
  const [draftSummary, setDraftSummary] = useState<DashboardDraftSummary | null>(null);
  const [renderSummary, setRenderSummary] = useState<DashboardRenderSummary | null>(null);
  const [downloadSummary, setDownloadSummary] = useState<DashboardDownloadSummary | null>(null);
  const [purchaseSummary, setPurchaseSummary] = useState<DashboardPurchaseSummary | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          membershipData,
          drafts,
          rendersAll,
          rendersCompleted,
          rendersProcessing,
          rendersFailed,
          downloads,
          purchases,
        ] = await Promise.all([
          fetchJson<MembershipMeResponse>('/api/memberships/me'),
          fetchJson<DraftListResult>('/api/drafts?page=1&pageSize=1'),
          fetchJson<RenderJobListResult>('/api/render-jobs?page=1&pageSize=1'),
          fetchJson<RenderJobListResult>(
            '/api/render-jobs?page=1&pageSize=1&status=COMPLETED',
          ),
          fetchJson<RenderJobListResult>(
            '/api/render-jobs?page=1&pageSize=1&status=PROCESSING',
          ),
          fetchJson<RenderJobListResult>('/api/render-jobs?page=1&pageSize=1&status=FAILED'),
          fetchJson<DownloadLogListResult>('/api/downloads?page=1&pageSize=1'),
          fetchJson<PurchaseHistoryResult>('/api/purchases?page=1&pageSize=1'),
        ]);

        setMembership(membershipData);
        setDraftSummary({
          total: drafts.total,
          latestUpdatedAt: drafts.items[0]?.updatedAt ?? null,
          latestTemplateName: drafts.items[0]?.templateName ?? null,
        });
        setRenderSummary({
          total: rendersAll.total,
          completed: rendersCompleted.total,
          processing: rendersProcessing.total,
          failed: rendersFailed.total,
        });
        setDownloadSummary({
          total: downloads.total,
          latestDownloadedAt: downloads.items[0]?.downloadedAt ?? null,
          latestTemplateName: downloads.items[0]?.templateName ?? null,
        });
        setPurchaseSummary({
          total: purchases.total,
          latestPurchaseDate: purchases.items[0]?.date ?? null,
          latestPlanName: purchases.items[0]?.planName ?? null,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) {
    return (
      <AccountStatsGrid>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </AccountStatsGrid>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load dashboard"
        description={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <AccountStatsGrid>
      <MembershipSummaryCard membership={membership} compact />

      <SummaryStatCard
        title="Drafts"
        icon={FileText}
        value={draftSummary?.total ?? 0}
        detail={
          draftSummary?.latestTemplateName
            ? `Latest: ${draftSummary.latestTemplateName}`
            : 'No drafts yet'
        }
        href="/account/drafts"
        emptyLabel="No drafts yet"
      />

      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Renders</CardTitle>
          <Clapperboard className="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="mt-auto space-y-2">
          <div className="text-2xl font-bold">{renderSummary?.total ?? 0}</div>
          <CardDescription className="text-xs">
            {renderSummary?.completed ?? 0} completed · {renderSummary?.processing ?? 0}{' '}
            processing · {renderSummary?.failed ?? 0} failed
          </CardDescription>
          <Button asChild variant="link" className="h-auto p-0" size="sm">
            <Link href="/account/renders">View render history</Link>
          </Button>
        </CardContent>
      </Card>

      <SummaryStatCard
        title="Downloads"
        icon={Download}
        value={downloadSummary?.total ?? 0}
        detail={
          downloadSummary?.latestDownloadedAt
            ? `Latest: ${formatAccountDate(downloadSummary.latestDownloadedAt)}`
            : 'No downloads yet'
        }
        href="/account/downloads"
        emptyLabel="No downloads yet"
      />

      <SummaryStatCard
        title="Purchases"
        icon={CreditCard}
        value={purchaseSummary?.total ?? 0}
        detail={
          purchaseSummary?.latestPlanName
            ? `Latest: ${purchaseSummary.latestPlanName}`
            : 'No purchases yet'
        }
        href="/account/purchases"
        emptyLabel="No purchases yet"
      />
    </AccountStatsGrid>
  );
}
