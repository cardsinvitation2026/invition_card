import Link from 'next/link';
import { MembershipDetailsClient } from '@/components/account/MembershipDetailsClient';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Membership',
  robots: { index: false, follow: false },
};

export default function AccountMembershipPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Membership</h1>
          <p className="mt-2 text-muted-foreground">
            View all active memberships and download entitlements.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/membership">Purchase plan</Link>
        </Button>
      </div>
      <MembershipDetailsClient />
    </div>
  );
}
