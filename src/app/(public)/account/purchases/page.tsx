import Link from 'next/link';
import { PurchaseHistoryClient } from '@/components/account/PurchaseHistoryClient';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Purchase history',
  robots: { index: false, follow: false },
};

export default function AccountPurchasesPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Purchase history</h1>
          <p className="mt-2 text-muted-foreground">
            Orders, payments, and memberships granted from checkout.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/membership">Buy membership</Link>
        </Button>
      </div>
      <PurchaseHistoryClient />
    </div>
  );
}
