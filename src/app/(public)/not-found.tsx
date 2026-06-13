import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state/EmptyState';

export default function PublicNotFound() {
  return (
    <div className="container py-20">
      <EmptyState
        title="404 — we couldn’t find that page"
        description="The link you followed may be broken, or the page may have moved."
        action={
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
        }
      />
    </div>
  );
}
