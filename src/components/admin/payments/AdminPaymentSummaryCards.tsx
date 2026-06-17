'use client';

import type { AdminPaymentSummary } from '@/types/admin-payment';
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

export function AdminPaymentSummaryCards({
  summary,
}: {
  summary: AdminPaymentSummary | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <SummaryCard
        title="Total Revenue"
        value={formatAccountPrice(summary?.totalRevenue ?? 0, 'INR')}
      />
      <SummaryCard title="Successful Payments" value={summary?.successfulPayments ?? 0} />
      <SummaryCard title="Pending Payments" value={summary?.pendingPayments ?? 0} />
      <SummaryCard title="Failed Payments" value={summary?.failedPayments ?? 0} />
      <SummaryCard title="Membership Sales" value={summary?.membershipSales ?? 0} />
    </div>
  );
}
