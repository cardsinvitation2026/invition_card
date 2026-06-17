'use client';

import type { AdminUserSummary } from '@/types/admin-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAccountPrice } from '@/lib/account/format';

function SummaryCard({ title, value }: { title: string; value: string | number }) {
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

export function AdminUserSummaryCards({
  summary,
}: {
  summary: AdminUserSummary | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard title="Total Users" value={summary?.totalUsers ?? 0} />
      <SummaryCard title="Active Members" value={summary?.activeMembers ?? 0} />
      <SummaryCard
        title="Total Revenue"
        value={formatAccountPrice(summary?.totalRevenue ?? 0, 'INR')}
      />
      <SummaryCard title="Total Drafts" value={summary?.totalDrafts ?? 0} />
      <SummaryCard title="Total Renders" value={summary?.totalRenders ?? 0} />
    </div>
  );
}
