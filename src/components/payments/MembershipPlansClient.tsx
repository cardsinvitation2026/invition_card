'use client';

import { useCallback, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MembershipPlanCard } from '@/components/payments/MembershipPlanCard';
import type { ApiResponse } from '@/types/api';
import type { MembershipPlanListItem } from '@/types/membership-plan';
import type { MembershipMeResponse } from '@/types/membership-engine';

interface MembershipPlansClientProps {
  initialPlans: MembershipPlanListItem[];
}

export function MembershipPlansClient({ initialPlans }: MembershipPlansClientProps) {
  const [plans] = useState(initialPlans);
  const [membership, setMembership] = useState<MembershipMeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembership = useCallback(async () => {
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
    void loadMembership();
  }, [loadMembership]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Failed to load membership" description={error} onRetry={() => void loadMembership()} />;
  }

  const remaining = membership?.remainingDownloads;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold">Your membership</h2>
        <div className="mt-3 space-y-2 text-sm text-muted-foreground">
          <p>
            Active memberships:{' '}
            <span className="font-medium text-foreground">
              {membership?.summary.activeMembershipCount ?? 0}
            </span>
          </p>
          <p>
            Remaining downloads:{' '}
            <span className="font-medium text-foreground">
              {remaining?.unlimited
                ? 'Unlimited'
                : String(remaining?.remainingDownloads ?? 0)}
            </span>
          </p>
        </div>
        {membership && membership.activeMemberships.length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {membership.activeMemberships.map((m) => (
              <li key={m.id} className="rounded-md border px-3 py-2">
                <span className="font-medium">{m.plan?.name ?? 'Plan'}</span>
                <span className="text-muted-foreground">
                  {' '}
                  — until {new Date(m.endDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Choose a plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <MembershipPlanCard
              key={plan.id}
              plan={plan}
              onPurchaseComplete={() => void loadMembership()}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
