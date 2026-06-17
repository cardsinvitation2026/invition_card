'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { AuditTimelineView } from '@/components/admin/audit/AuditTimeline';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import type { AuditTimeline } from '@/types/audit';

export function EntityAuditClient({
  title,
  description,
  endpoint,
}: {
  title: string;
  description: string;
  endpoint: string;
}) {
  const [timeline, setTimeline] = useState<AuditTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<AuditTimeline>(endpoint);
      setTimeline(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit timeline');
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !timeline) {
    return <ErrorState description={error ?? 'Audit timeline unavailable'} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={timeline.title || title}
        description={timeline.description ?? description}
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />
      <AdminSectionCard title="Timeline" description={`${timeline.events.length} event(s) reconstructed.`}>
        <AuditTimelineView timeline={timeline} />
      </AdminSectionCard>
    </div>
  );
}

export function CustomerAuditClient({ userId }: { userId: string }) {
  return (
    <EntityAuditClient
      title="Customer audit"
      description="Customer lifecycle investigation"
      endpoint={`/api/admin/audit/customer/${encodeURIComponent(userId)}`}
    />
  );
}

export function RenderAuditClient({ renderJobId }: { renderJobId: string }) {
  return (
    <EntityAuditClient
      title="Render audit"
      description="Render job investigation"
      endpoint={`/api/admin/audit/render/${encodeURIComponent(renderJobId)}`}
    />
  );
}

export function PaymentAuditClient({ paymentId }: { paymentId: string }) {
  return (
    <EntityAuditClient
      title="Payment audit"
      description="Payment and order investigation"
      endpoint={`/api/admin/audit/payment/${encodeURIComponent(paymentId)}`}
    />
  );
}

export function MembershipAuditClient({ membershipId }: { membershipId: string }) {
  return (
    <EntityAuditClient
      title="Membership audit"
      description="Membership entitlement investigation"
      endpoint={`/api/admin/audit/membership/${encodeURIComponent(membershipId)}`}
    />
  );
}

export function DownloadAuditClient({ downloadLogId }: { downloadLogId: string }) {
  return (
    <EntityAuditClient
      title="Download audit"
      description="Download dispute investigation"
      endpoint={`/api/admin/audit/download/${encodeURIComponent(downloadLogId)}`}
    />
  );
}
