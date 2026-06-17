import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RenderJobsListClient } from '@/components/admin/lists/RenderJobsListClient';

export const metadata = { title: 'Render Jobs' };

export default function AdminRenderJobsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RenderJobsListClient />
    </Suspense>
  );
}
