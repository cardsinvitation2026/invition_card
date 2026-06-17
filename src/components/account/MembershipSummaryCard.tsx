import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatAccountDate } from '@/lib/account/format';
import type { MembershipMeResponse } from '@/types/membership-engine';

interface MembershipSummaryCardProps {
  membership: MembershipMeResponse | null;
  loading?: boolean;
  compact?: boolean;
}

export function MembershipSummaryCard({
  membership,
  loading = false,
  compact = false,
}: MembershipSummaryCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  const active = membership?.activeMemberships ?? [];
  const remaining = membership?.remainingDownloads;
  const primary = active[0] ?? null;

  if (active.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
          <CardDescription>No active membership</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Purchase a plan to unlock video downloads.
          </p>
          {!compact && (
            <Button asChild className="mt-4" size="sm">
              <Link href="/membership">View plans</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">
            {compact ? 'Active membership' : primary?.plan?.name ?? 'Membership'}
          </CardTitle>
          <Badge variant="secondary">{primary?.status ?? 'ACTIVE'}</Badge>
        </div>
        {!compact && active.length > 1 && (
          <CardDescription>{active.length} active memberships</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {compact ? (
          <>
            <p>
              <span className="text-muted-foreground">Plan: </span>
              {primary?.plan?.name ?? '—'}
            </p>
            <p>
              <span className="text-muted-foreground">Expires: </span>
              {formatAccountDate(primary?.endDate)}
            </p>
          </>
        ) : (
          <p>
            <span className="text-muted-foreground">Expires: </span>
            {formatAccountDate(primary?.endDate)}
          </p>
        )}
        <p>
          <span className="text-muted-foreground">Downloads: </span>
          {remaining?.unlimited ? (
            <Badge variant="outline" className="ml-1">
              Unlimited
            </Badge>
          ) : (
            <span className="font-medium">{remaining?.remainingDownloads ?? 0} remaining</span>
          )}
        </p>
        {!compact && (
          <Button asChild variant="link" className="h-auto p-0" size="sm">
            <Link href="/account/membership">View all memberships</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
