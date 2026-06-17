import { membershipPlanService } from '@/features/membership-plans';
import { MembershipPlansClient } from '@/components/payments/MembershipPlansClient';

export const metadata = {
  title: 'Membership',
  robots: { index: false, follow: false },
};

export default async function MembershipPage() {
  const plans = await membershipPlanService.listActivePlans();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Membership</h1>
        <p className="mt-2 text-muted-foreground">
          Purchase a plan to unlock download entitlements for your invitations.
        </p>
      </div>
      <MembershipPlansClient initialPlans={plans} />
    </div>
  );
}
