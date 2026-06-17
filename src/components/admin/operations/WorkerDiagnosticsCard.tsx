'use client';

import type { WorkerDiagnosticsSnapshot } from '@/types/operations';
import { Badge } from '@/components/ui/badge';

function formatTimestamp(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function WorkerDiagnosticsCard({ worker }: { worker: WorkerDiagnosticsSnapshot }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="rounded-md border p-3">
        <p className="text-sm text-muted-foreground">Running</p>
        <Badge variant={worker.running ? 'default' : 'secondary'} className="mt-2">
          {worker.running ? 'Running' : 'Stopped'}
        </Badge>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm text-muted-foreground">Worker started at</p>
        <p className="mt-1 font-medium">{formatTimestamp(worker.workerStartedAt)}</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm text-muted-foreground">Last poll at</p>
        <p className="mt-1 font-medium">{formatTimestamp(worker.lastPollAt)}</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm text-muted-foreground">Jobs retried</p>
        <p className="mt-1 text-2xl font-bold">{worker.jobsRetried}</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm text-muted-foreground">Stuck jobs recovered</p>
        <p className="mt-1 text-2xl font-bold">{worker.stuckJobsRecovered}</p>
      </div>
      <div className="rounded-md border p-3">
        <p className="text-sm text-muted-foreground">Healthy window</p>
        <p className="mt-1 font-medium">{worker.healthyWindowMs}ms (2× poll interval)</p>
      </div>
    </div>
  );
}
