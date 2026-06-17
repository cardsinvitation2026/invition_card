import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RenderAuditClient } from '@/components/admin/audit/RenderAuditClient';

export const metadata = { title: 'Render Audit' };

export default async function AdminRenderAuditPage({
  params,
}: {
  params: Promise<{ renderJobId: string }>;
}) {
  const { renderJobId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <RenderAuditClient renderJobId={renderJobId} />
    </Suspense>
  );
}
