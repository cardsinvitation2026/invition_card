'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { ErrorState } from '@/components/feedback/ErrorState';
import { SystemHealthCards } from '@/components/admin/operations/SystemHealthCards';
import { EnvironmentDiagnosticsCard } from '@/components/admin/operations/EnvironmentDiagnosticsCard';
import { WorkerDiagnosticsCard } from '@/components/admin/operations/WorkerDiagnosticsCard';
import { QueueDiagnosticsCard } from '@/components/admin/operations/QueueDiagnosticsCard';
import { adminFetch } from '@/lib/admin/api';
import type { AdminOperationsSnapshot } from '@/types/operations';

export function OperationsDashboardClient() {
  const [snapshot, setSnapshot] = useState<AdminOperationsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminFetch<AdminOperationsSnapshot>('/api/admin/operations');
      setSnapshot(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load operations data');
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
    return <ErrorState description={error ?? 'Operations data unavailable'} onRetry={() => void load()} />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Operations"
        description="Read-only production health, worker, queue, and deployment diagnostics."
        actions={
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh
          </Button>
        }
      />

      <AdminSectionCard title="System Health" description="Load-balancer compatible health signals.">
        <SystemHealthCards {...snapshot.health} />
      </AdminSectionCard>

      <AdminSectionCard
        title="Environment Validation"
        description="Production configuration visibility. Development mode never blocks startup."
      >
        <EnvironmentDiagnosticsCard environment={snapshot.environment} />
      </AdminSectionCard>

      <AdminSectionCard title="Worker Diagnostics" description="Stage 16C reliability metrics and worker liveness.">
        <WorkerDiagnosticsCard worker={snapshot.worker} />
      </AdminSectionCard>

      <AdminSectionCard title="Render Queue Diagnostics" description="Render job queue counts from existing services.">
        <QueueDiagnosticsCard queue={snapshot.queue} />
      </AdminSectionCard>

      <AdminSectionCard title="Deployment Readiness" description="Pre-deployment verification checklist.">
        <div className="space-y-4">
          <Badge variant={snapshot.deployment.ready ? 'default' : 'destructive'}>
            {snapshot.deployment.ready ? 'Ready' : 'Not ready'}
          </Badge>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(snapshot.deployment.checks).map(([key, value]) => (
              <div key={key} className="rounded-md border p-3 text-sm">
                <p className="text-muted-foreground">{key}</p>
                <p className={value ? 'font-medium text-emerald-700' : 'font-medium text-red-700'}>
                  {value ? 'Pass' : 'Fail'}
                </p>
              </div>
            ))}
          </div>
          {snapshot.deployment.issues.length > 0 && (
            <ul className="list-disc space-y-1 pl-5 text-sm text-red-700">
              {snapshot.deployment.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          )}
        </div>
      </AdminSectionCard>
    </div>
  );
}
