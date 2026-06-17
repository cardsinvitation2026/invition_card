import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DownloadAuditClient } from '@/components/admin/audit/DownloadAuditClient';

export const metadata = { title: 'Download Audit' };

export default async function AdminDownloadAuditPage({
  params,
}: {
  params: Promise<{ downloadLogId: string }>;
}) {
  const { downloadLogId } = await params;
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full" />}>
      <DownloadAuditClient downloadLogId={downloadLogId} />
    </Suspense>
  );
}
