import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplatesListClient } from '@/components/admin/lists/TemplatesListClient';

export const metadata = { title: 'Templates' };

export default function AdminTemplatesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <TemplatesListClient />
    </Suspense>
  );
}
