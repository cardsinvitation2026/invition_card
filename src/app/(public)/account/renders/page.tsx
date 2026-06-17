import Link from 'next/link';
import { RenderHistoryClient } from '@/components/account/RenderHistoryClient';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Render history',
  robots: { index: false, follow: false },
};

export default function AccountRendersPage() {
  return (
    <div className="container py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Render history</h1>
          <p className="mt-2 text-muted-foreground">
            Track your video render jobs. Opening a completed video does not consume download
            quota.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/account/drafts">View drafts</Link>
        </Button>
      </div>
      <RenderHistoryClient />
    </div>
  );
}
