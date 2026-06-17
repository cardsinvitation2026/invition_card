'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorState } from '@/components/feedback/ErrorState';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { formatAccountDate } from '@/lib/account/format';
import type { ApiResponse } from '@/types/api';
import type { MembershipMeResponse } from '@/types/membership-engine';

function formatLimit(limit: number | null | undefined): string {
  return limit === null || limit === undefined ? 'Unlimited' : String(limit);
}

export function MembershipDetailsClient() {
  const [membership, setMembership] = useState<MembershipMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/memberships/me', { credentials: 'include' });
      const data = (await res.json()) as ApiResponse<MembershipMeResponse>;
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? 'Failed to load membership');
      }
      setMembership(data.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load membership');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to load membership"
        description={error}
        onRetry={() => void load()}
      />
    );
  }

  const active = membership?.activeMemberships ?? [];
  const remaining = membership?.remainingDownloads;

  if (active.length === 0) {
    return (
      <AdminEmptyState
        title="No active membership"
        description="Purchase a plan to unlock video downloads for your invitations."
        action={
          <Button asChild>
            <Link href="/membership">View membership plans</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Download entitlement</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {remaining?.unlimited ? (
            <Badge variant="secondary">Unlimited downloads</Badge>
          ) : (
            <p>
              <span className="font-medium text-foreground">
                {remaining?.remainingDownloads ?? 0}
              </span>{' '}
              downloads remaining across active memberships
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {active.map((m) => {
          const limit = m.plan?.downloadLimit ?? null;
          const perEntry = remaining?.perMembership.find((p) => p.membershipId === m.id);
          const remainingForPlan = perEntry?.remaining;

          return (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{m.plan?.name ?? 'Plan'}</CardTitle>
                <Badge variant="secondary">{m.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Started: </span>
                  {formatAccountDate(m.startDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">Expires: </span>
                  {formatAccountDate(m.endDate)}
                </p>
                <p>
                  <span className="text-muted-foreground">Downloads used: </span>
                  {m.downloadsUsed}
                </p>
                <p>
                  <span className="text-muted-foreground">Download limit: </span>
                  {formatLimit(limit)}
                </p>
                <p>
                  <span className="text-muted-foreground">Remaining: </span>
                  {limit === null ? (
                    <Badge variant="outline" className="ml-1">
                      Unlimited
                    </Badge>
                  ) : (
                    <span className="font-medium">{remainingForPlan ?? 0}</span>
                  )}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
