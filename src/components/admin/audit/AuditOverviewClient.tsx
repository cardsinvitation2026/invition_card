'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SystemObservabilityCards } from '@/components/admin/audit/SystemObservabilityCards';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import type { AuditOverviewSnapshot } from '@/types/audit';

export function AuditOverviewClient() {
  const [snapshot, setSnapshot] = useState<AuditOverviewSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState('');
  const [renderId, setRenderId] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [downloadId, setDownloadId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<AuditOverviewSnapshot>('/api/admin/audit');
      setSnapshot(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit overview');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (error || !snapshot) {
    return <ErrorState description={error ?? 'Audit overview unavailable'} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Audit & Observability"
        description="Read-only investigation center built from existing persisted records."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />

      <AdminSectionCard
        title="Investigation shortcuts"
        description="Open entity timelines using existing record identifiers."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <InvestigationField
            label="Customer user ID"
            value={customerId}
            onChange={setCustomerId}
            href={customerId ? adminRoutes.auditCustomer(customerId) : undefined}
          />
          <InvestigationField
            label="Render job ID"
            value={renderId}
            onChange={setRenderId}
            href={renderId ? adminRoutes.auditRender(renderId) : undefined}
          />
          <InvestigationField
            label="Payment ID"
            value={paymentId}
            onChange={setPaymentId}
            href={paymentId ? adminRoutes.auditPayment(paymentId) : undefined}
          />
          <InvestigationField
            label="Membership ID"
            value={membershipId}
            onChange={setMembershipId}
            href={membershipId ? adminRoutes.auditMembership(membershipId) : undefined}
          />
          <InvestigationField
            label="Download log ID"
            value={downloadId}
            onChange={setDownloadId}
            href={downloadId ? adminRoutes.auditDownload(downloadId) : undefined}
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="System observability" description="Stage 16C + 16D diagnostics.">
        <SystemObservabilityCards observability={snapshot.observability} />
      </AdminSectionCard>
    </div>
  );
}

function InvestigationField({
  label,
  value,
  onChange,
  href,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  href?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex gap-2">
        <Input value={value} onChange={(event) => onChange(event.target.value.trim())} />
        <Button asChild variant="outline" disabled={!href}>
          <Link href={href ?? '#'}>
            <Search className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
