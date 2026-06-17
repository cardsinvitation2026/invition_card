'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import {
  LaunchReadinessCards,
  ReadinessChecklist,
} from '@/components/admin/launch-readiness/LaunchReadinessCards';
import { VerificationStatusTable } from '@/components/admin/launch-readiness/VerificationStatusTable';
import { DisasterRecoveryChecklist } from '@/components/admin/launch-readiness/DisasterRecoveryChecklist';
import { adminFetch } from '@/lib/admin/api';
import type { LaunchReadinessSnapshot } from '@/types/launch-readiness';

export function LaunchReadinessClient() {
  const [snapshot, setSnapshot] = useState<LaunchReadinessSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<LaunchReadinessSnapshot>('/api/admin/launch-readiness');
      setSnapshot(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load launch readiness');
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
    return (
      <ErrorState description={error ?? 'Launch readiness unavailable'} onRetry={() => void load()} />
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Launch Readiness"
        description="Production go/no-go evaluation using existing operational signals. Read-only."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={snapshot.decision === 'READY' ? 'secondary' : 'destructive'}>
              {snapshot.decision}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>
        }
      />

      {snapshot.blockers.length > 0 ? (
        <AdminSectionCard title="Launch blockers" description="Must be resolved before production release.">
          <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">
            {snapshot.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        </AdminSectionCard>
      ) : null}

      {snapshot.warnings.length > 0 ? (
        <AdminSectionCard title="Warnings" description="Non-blocking launch notes.">
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {snapshot.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </AdminSectionCard>
      ) : null}

      <AdminSectionCard title="Summary">
        <LaunchReadinessCards snapshot={snapshot} />
      </AdminSectionCard>

      <AdminSectionCard title="Environment readiness">
        <ReadinessChecklist title="Mandatory secrets" checks={snapshot.environment.checks} />
      </AdminSectionCard>

      <AdminSectionCard title="Infrastructure readiness">
        <div className="space-y-6">
          <ReadinessChecklist title="Database" checks={snapshot.database.checks} />
          <ReadinessChecklist title="Cloudinary" checks={snapshot.cloudinary.checks} />
          <ReadinessChecklist title="Razorpay" checks={snapshot.razorpay.checks} />
          <ReadinessChecklist title="Worker" checks={snapshot.worker.checks} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Security hardening signals">
        <ReadinessChecklist title="Stage 16E–16H protections" checks={snapshot.security.checks} />
      </AdminSectionCard>

      <AdminSectionCard title="Verification suite coverage">
        <VerificationStatusTable suites={snapshot.verification.suites} />
      </AdminSectionCard>

      <AdminSectionCard title="Disaster recovery checklist">
        <DisasterRecoveryChecklist snapshot={snapshot.disasterRecovery} />
      </AdminSectionCard>
    </div>
  );
}
