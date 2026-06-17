'use client';

import type { QueueDiagnosticsSnapshot } from '@/types/operations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function QueueMetric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function QueueDiagnosticsCard({ queue }: { queue: QueueDiagnosticsSnapshot }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <QueueMetric title="Pending" value={queue.pendingJobs} />
      <QueueMetric title="Processing" value={queue.processingJobs} />
      <QueueMetric title="Completed" value={queue.completedJobs} />
      <QueueMetric title="Failed" value={queue.failedJobs} />
      <QueueMetric title="Retryable failed" value={queue.retryableFailedJobs} />
    </div>
  );
}
