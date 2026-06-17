'use client';

import type { AdminMembershipSummary } from '@/types/admin-membership';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

export function AdminMembershipSummaryCards({
  summary,
}: {
  summary: AdminMembershipSummary | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard title="Total Memberships" value={summary?.totalMemberships ?? 0} />
      <SummaryCard title="Active Memberships" value={summary?.activeMemberships ?? 0} />
      <SummaryCard title="Expired Memberships" value={summary?.expiredMemberships ?? 0} />
      <SummaryCard title="Cancelled Memberships" value={summary?.cancelledMemberships ?? 0} />
      <SummaryCard title="Downloads Consumed" value={summary?.downloadsConsumed ?? 0} />
    </div>
  );
}
