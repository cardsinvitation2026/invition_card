'use client';

import { Badge } from '@/components/ui/badge';
import type { SystemObservabilitySnapshot } from '@/types/audit';
import { SystemHealthCards } from '@/components/admin/operations/SystemHealthCards';
import { WorkerDiagnosticsCard } from '@/components/admin/operations/WorkerDiagnosticsCard';
import { QueueDiagnosticsCard } from '@/components/admin/operations/QueueDiagnosticsCard';

export function SystemObservabilityCards({
  observability,
}: {
  observability: SystemObservabilitySnapshot;
}) {
  return (
    <div className="space-y-6">
      <SystemHealthCards {...observability.health} />

      <div className="grid gap-4 md:grid-cols-2">
        <WorkerDiagnosticsCard worker={observability.worker} />
        <QueueDiagnosticsCard queue={observability.queue} />
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Stage 16C reliability metrics</p>
          <Badge variant="outline">Read-only</Badge>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Pending jobs" value={observability.reliability.pendingJobs} />
          <Metric label="Processing jobs" value={observability.reliability.processingJobs} />
          <Metric label="Completed jobs" value={observability.reliability.completedJobs} />
          <Metric label="Failed jobs" value={observability.reliability.failedJobs} />
          <Metric label="Retryable failed" value={observability.reliability.retryableFailedJobs} />
          <Metric label="Stuck recovered" value={observability.reliability.stuckJobsRecovered} />
          <Metric label="Jobs retried" value={observability.reliability.jobsRetried} />
        </dl>
      </div>

      <div className="rounded-lg border p-4">
        <p className="mb-3 text-sm font-medium">Deployment readiness</p>
        <Badge variant={observability.deployment.ready ? 'secondary' : 'destructive'}>
          {observability.deployment.ready ? 'Ready' : 'Not ready'}
        </Badge>
        {observability.deployment.issues.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {observability.deployment.issues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
