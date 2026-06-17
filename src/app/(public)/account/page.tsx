import Link from 'next/link';
import { AccountDashboardCards } from '@/components/account/AccountDashboardCards';
import { AccountQuickActions } from '@/components/account/AccountQuickActions';

export const metadata = {
  title: 'My account',
  robots: { index: false, follow: false },
};

export default function AccountDashboardPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My account</h1>
        <p className="mt-2 text-muted-foreground">
          Overview of your memberships, drafts, renders, downloads, and purchases.
        </p>
      </div>

      <div className="space-y-8">
        <AccountDashboardCards />
        <AccountQuickActions />

        <nav className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <Link href="/account/membership" className="hover:text-foreground">
            Membership
          </Link>
          <Link href="/account/drafts" className="hover:text-foreground">
            Drafts
          </Link>
          <Link href="/account/renders" className="hover:text-foreground">
            Renders
          </Link>
          <Link href="/account/downloads" className="hover:text-foreground">
            Downloads
          </Link>
          <Link href="/account/purchases" className="hover:text-foreground">
            Purchases
          </Link>
        </nav>
      </div>
    </div>
  );
}
