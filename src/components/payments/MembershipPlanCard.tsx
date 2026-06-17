import type { MembershipPlanListItem } from '@/types/membership-plan';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MembershipCheckoutButton } from '@/components/payments/MembershipCheckoutButton';

function formatPrice(paise: number, currency: string): string {
  const amount = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDownloadLimit(limit: number | null): string {
  return limit === null ? 'Unlimited' : String(limit);
}

interface MembershipPlanCardProps {
  plan: MembershipPlanListItem;
  onPurchaseComplete: () => void;
}

export function MembershipPlanCard({ plan, onPurchaseComplete }: MembershipPlanCardProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle>{plan.name}</CardTitle>
          {plan.downloadLimit === null && (
            <Badge variant="secondary">Unlimited downloads</Badge>
          )}
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">
              {formatPrice(plan.price, plan.currency)}
            </span>{' '}
            / {plan.validityDays} days
          </p>
          <p>Downloads: {formatDownloadLimit(plan.downloadLimit)}</p>
        </div>
        <MembershipCheckoutButton
          planId={plan.id}
          planName={plan.name}
          onComplete={onPurchaseComplete}
        />
      </CardContent>
    </Card>
  );
}
