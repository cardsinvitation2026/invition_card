'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { formatAccountDate, formatAccountPrice } from '@/lib/account/format';
import type { ApiResponse } from '@/types/api';
import type { PurchaseHistoryResult } from '@/types/account-dashboard';

const PAGE_SIZE = 10;

function statusBadgeVariant(status: string | null) {
  if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'ACTIVE') {
    return 'secondary' as const;
  }
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
    return 'destructive' as const;
  }
  return 'outline' as const;
}

export function PurchaseHistoryClient() {
  const [items, setItems] = useState<PurchaseHistoryResult['items']>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      const res = await fetch(`/api/purchases?${qs.toString()}`, { credentials: 'include' });
      const data = (await res.json()) as ApiResponse<PurchaseHistoryResult>;
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? 'Failed to load purchases');
      }
      setItems(data.data?.items ?? []);
      setPageCount(data.data?.pageCount ?? 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load purchases"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  if (items.length === 0) {
    return (
      <AdminEmptyState
        title="No purchases yet"
        description="Your membership purchase history will appear here after checkout."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden overflow-hidden rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Membership</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.orderId} className="border-b last:border-b-0">
                <td className="px-4 py-3 text-muted-foreground">
                  {formatAccountDate(item.date)}
                </td>
                <td className="px-4 py-3">{item.planName ?? '—'}</td>
                <td className="px-4 py-3">{formatAccountPrice(item.amount, item.currency)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(item.orderStatus)}>{item.orderStatus}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(item.paymentStatus)}>
                    {item.paymentStatus ?? '—'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusBadgeVariant(item.membershipStatus)}>
                    {item.membershipStatus ?? '—'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {items.map((item) => (
          <Card key={item.orderId}>
            <CardContent className="space-y-2 p-4 text-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{item.planName ?? 'Membership purchase'}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatAccountDate(item.date)}
                  </p>
                </div>
                <p className="font-medium">{formatAccountPrice(item.amount, item.currency)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={statusBadgeVariant(item.orderStatus)}>
                  Order: {item.orderStatus}
                </Badge>
                <Badge variant={statusBadgeVariant(item.paymentStatus)}>
                  Payment: {item.paymentStatus ?? '—'}
                </Badge>
                <Badge variant={statusBadgeVariant(item.membershipStatus)}>
                  Membership: {item.membershipStatus ?? '—'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AdminPagination page={page} pageCount={pageCount} onPageChange={setPage} />
    </div>
  );
}
