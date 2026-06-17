import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LaunchReadinessClient } from '@/components/admin/launch-readiness/LaunchReadinessClient';

export const metadata = { title: 'Launch Readiness' };

export default function AdminLaunchReadinessPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <LaunchReadinessClient />
    </Suspense>
  );
}
