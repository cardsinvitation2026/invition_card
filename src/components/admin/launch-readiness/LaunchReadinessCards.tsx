'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LaunchReadinessSnapshot, ReadinessCheckItem } from '@/types/launch-readiness';

export function LaunchReadinessCards({ snapshot }: { snapshot: LaunchReadinessSnapshot }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <SummaryCard
        title="Launch decision"
        value={snapshot.decision}
        variant={snapshot.decision === 'READY' ? 'secondary' : 'destructive'}
      />
      <SummaryCard title="Environment mode" value={snapshot.environment.mode} />
      <SummaryCard
        title="Worker"
        value={snapshot.worker.running ? 'Running' : 'Stopped'}
        variant={snapshot.worker.running ? 'secondary' : 'destructive'}
      />
      <SummaryCard
        title="Database"
        value={snapshot.database.prismaAvailable ? (snapshot.database.connected ? 'Connected' : 'Down') : 'In-memory'}
      />
      <SummaryCard
        title="Cloudinary"
        value={snapshot.cloudinary.configured ? 'Ready' : 'Missing'}
        variant={snapshot.cloudinary.configured ? 'secondary' : 'destructive'}
      />
      <SummaryCard
        title="Razorpay"
        value={snapshot.razorpay.configured ? 'Ready' : 'Missing'}
        variant={snapshot.razorpay.configured ? 'secondary' : 'destructive'}
      />
    </div>
  );
}

function SummaryCard({
  title,
  value,
  variant = 'outline',
}: {
  title: string;
  value: string;
  variant?: 'secondary' | 'destructive' | 'outline';
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Badge variant={variant}>{value}</Badge>
      </CardContent>
    </Card>
  );
}

export function ReadinessChecklist({
  title,
  checks,
}: {
  title: string;
  checks: ReadinessCheckItem[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{title}</p>
      <ul className="space-y-2">
        {checks.map((check) => (
          <li
            key={check.id}
            className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{check.label}</p>
              <p className="text-sm text-muted-foreground">{check.message}</p>
              {check.details?.map((detail) => (
                <p key={detail} className="text-xs text-muted-foreground">
                  {detail}
                </p>
              ))}
            </div>
            <StatusBadge status={check.status} critical={check.critical} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusBadge({
  status,
  critical,
}: {
  status: ReadinessCheckItem['status'];
  critical: boolean;
}) {
  if (status === 'pass') {
    return <Badge variant="secondary">PASS</Badge>;
  }
  if (status === 'fail') {
    return <Badge variant="destructive">{critical ? 'CRITICAL FAIL' : 'FAIL'}</Badge>;
  }
  if (status === 'warn') {
    return <Badge variant="outline">WARN</Badge>;
  }
  return <Badge variant="outline">UNKNOWN</Badge>;
}
