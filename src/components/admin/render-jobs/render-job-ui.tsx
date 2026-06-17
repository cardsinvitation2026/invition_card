'use client';

import { toast } from 'sonner';
import type { RenderJobStatus } from '@/types/render-job';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { adminFetch } from '@/lib/admin/api';
import type { SignedVideoAccess } from '@/types/video-access';

export function RenderJobStatusBadge({ status }: { status: RenderJobStatus }) {
  switch (status) {
    case 'COMPLETED':
      return <AdminStatusBadge label="COMPLETED" variant="success" />;
    case 'PROCESSING':
      return <AdminStatusBadge label="PROCESSING" variant="warning" />;
    case 'FAILED':
      return <AdminStatusBadge label="FAILED" variant="destructive" />;
    default:
      return <AdminStatusBadge label="PENDING" variant="muted" />;
  }
}

export function truncateJobId(id: string): string {
  if (id.length <= 12) {
    return id;
  }
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function displayUserLabel(name: string | null, email: string): string {
  return name?.trim() ? name : email;
}

export async function openSecureRenderVideo(renderJobId: string): Promise<void> {
  try {
    const response = await adminFetch<SignedVideoAccess>(
      `/api/video-access/render/${encodeURIComponent(renderJobId)}`,
    );
    if (!response.data?.url) {
      toast.error('Video URL unavailable');
      return;
    }
    window.open(response.data.url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    toast.error(error instanceof Error ? error.message : 'Failed to open video');
  }
}

/** @deprecated Use openSecureRenderVideo instead. */
export function openRenderVideo(_url: string | null) {
  toast.error('Direct video URLs are no longer supported');
}
