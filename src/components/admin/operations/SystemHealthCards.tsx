'use client';

import type {
  ComponentHealthStatus,
  HealthStatus,
  WorkerHealthStatus,
} from '@/types/operations';
import { cn } from '@/lib/utils';

function statusTone(status: HealthStatus | ComponentHealthStatus | WorkerHealthStatus): string {
  if (status === 'healthy' || status === 'running') {
    return 'text-emerald-600';
  }
  if (status === 'degraded') {
    return 'text-amber-600';
  }
  return 'text-red-600';
}

function StatusValue({
  label,
  status,
}: {
  label: string;
  status: HealthStatus | ComponentHealthStatus | WorkerHealthStatus;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-lg font-semibold capitalize', statusTone(status))}>{status}</p>
    </div>
  );
}

export function SystemHealthCards({
  status,
  timestamp,
  database,
  cloudinary,
  razorpay,
  worker,
}: {
  status: HealthStatus;
  timestamp: string;
  database: { status: ComponentHealthStatus };
  cloudinary: { status: ComponentHealthStatus };
  razorpay: { status: ComponentHealthStatus };
  worker: { status: WorkerHealthStatus };
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatusValue label="Overall" status={status} />
        <StatusValue label="Database" status={database.status} />
        <StatusValue label="Cloudinary" status={cloudinary.status} />
        <StatusValue label="Razorpay" status={razorpay.status} />
        <StatusValue label="Worker" status={worker.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        Last health check: {new Date(timestamp).toLocaleString()}
      </p>
    </div>
  );
}
