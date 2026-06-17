import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/server';
import { TemplateEditPageClient } from '@/components/runtime-form/TemplateEditPageClient';
import { templateService } from '@/features/templates';
import { templateMusicService } from '@/features/template-music';

type Params = Promise<{ slug: string }>;

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const t = await templateService.getBySlug(slug);
  if (!t) return { title: 'Edit template' };
  return {
    title: `Personalise ${t.name}`,
    description: `Fill dynamic fields for ${t.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function TemplateEditPage({ params }: { params: Params }) {
  const { slug } = await params;
  const session = await getServerSession();
  if (!session) {
    redirect(`/login?next=/templates/${slug}/edit`);
  }

  const template = await templateService.getBySlug(slug);
  let musicUrl: string | null = null;
  if (template?.musicId) {
    const music = await templateMusicService.findById(template.musicId);
    musicUrl = music?.url ?? null;
  }

  return <TemplateEditPageClient slug={slug} musicUrl={musicUrl} />;
}
