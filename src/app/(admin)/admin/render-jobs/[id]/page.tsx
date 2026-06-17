import { RenderJobDetailClient } from '@/components/admin/render-jobs/RenderJobDetailClient';

export const metadata = { title: 'Render Job Details' };

export default async function AdminRenderJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RenderJobDetailClient jobId={id} />;
}
