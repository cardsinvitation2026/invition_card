'use client';

import type { AdminRenderJobSummary } from '@/types/admin-render-job';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function SummaryCard({ title, value }: { title: string; value: number }) {
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

export function AdminRenderJobSummaryCards({
  summary,
}: {
  summary: AdminRenderJobSummary | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard title="Total render jobs" value={summary?.total ?? 0} />
      <SummaryCard title="Pending" value={summary?.pending ?? 0} />
      <SummaryCard title="Processing" value={summary?.processing ?? 0} />
      <SummaryCard title="Completed" value={summary?.completed ?? 0} />
      <SummaryCard title="Failed" value={summary?.failed ?? 0} />
    </div>
  );
}
