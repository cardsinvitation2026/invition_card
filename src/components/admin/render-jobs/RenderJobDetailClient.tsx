'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminSectionCard } from '@/components/admin/AdminSectionCard';
import { RenderJobStatusBadge, openSecureRenderVideo } from '@/components/admin/render-jobs/render-job-ui';
import { ErrorState } from '@/components/feedback/ErrorState';
import { adminFetch } from '@/lib/admin/api';
import { adminRoutes } from '@/lib/admin/routes';
import {
  formatAdminDateTime,
  formatRenderDuration,
} from '@/lib/admin/render-job-format';
import type { AdminRenderJobDetail } from '@/types/admin-render-job';

function DetailField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

export function RenderJobDetailClient({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<AdminRenderJobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch<AdminRenderJobDetail>(`/api/admin/render-jobs/${jobId}`);
      setJob(res.data ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load render job');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (!job) {
    return <ErrorState title="Render job not found" description="This job may have been removed." />;
  }

  const duration = formatRenderDuration(job.createdAt, job.completedAt);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Render job details"
        description={`Job ${job.id}`}
        actions={
          <Button asChild variant="outline">
            <Link href={adminRoutes.renderJobs}>Back to list</Link>
          </Button>
        }
      />

      <AdminSectionCard title="Render information">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Job ID" value={<code className="font-mono text-xs">{job.id}</code>} />
          <DetailField label="Status" value={<RenderJobStatusBadge status={job.status} />} />
          <DetailField label="Created" value={formatAdminDateTime(job.createdAt)} />
          <DetailField label="Completed" value={formatAdminDateTime(job.completedAt)} />
          <DetailField label="Duration" value={duration ?? '—'} />
          <DetailField
            label="Final URL"
            value={
              job.status === 'COMPLETED' ? (
                <Button
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => void openSecureRenderVideo(job.id)}
                >
                  Open Video
                  <ExternalLink className="ml-1 size-3" />
                </Button>
              ) : (
                '—'
              )
            }
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Template">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Template title" value={job.templateName} />
          <DetailField label="Template slug" value={job.templateSlug || '—'} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="User">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Name" value={job.userName ?? '—'} />
          <DetailField label="Email" value={job.userEmail} />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Draft">
        <DetailField
          label="Draft ID"
          value={
            <Link href="/account/drafts" className="font-mono text-xs text-primary hover:underline">
              {job.draftId}
            </Link>
          }
        />
      </AdminSectionCard>

      {job.status === 'FAILED' && job.error && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Error message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
