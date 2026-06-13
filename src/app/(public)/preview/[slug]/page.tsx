import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PreviewPlayer } from '@/components/preview/PreviewPlayer';
import { templateService } from '@/features/templates';
import { breadcrumbLd } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const t = await templateService.getBySlug(slug);
  if (!t) return { title: 'Preview not found' };
  return {
    title: `Preview — ${t.name}`,
    description: `Watch a public preview of ${t.name}.`,
    openGraph: { images: [t.thumbnail] },
  };
}

export default async function PublicPreviewPage({ params }: { params: Params }) {
  const { slug } = await params;
  const t = await templateService.getBySlug(slug);
  if (!t) notFound();

  return (
    <div className="container py-8">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link href={`/templates/${t.slug}`}>
          <ArrowLeft className="mr-1 size-4" /> Back to template
        </Link>
      </Button>

      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge variant="outline">Public preview</Badge>
          <Badge variant="outline">{t.category.name}</Badge>
          <Badge variant="outline">{t.language === 'HI' ? 'हिंदी' : 'English'}</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{t.name}</h1>
        <p className="mt-2 text-muted-foreground">{t.description}</p>

        <div className="mt-6 aspect-video overflow-hidden rounded-xl border bg-muted">
          <PreviewPlayer thumbnail={t.thumbnail} videoUrl={t.demoPreviewUrl} alt={t.name} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-5">
          <div>
            <p className="text-sm font-semibold">Like what you see?</p>
            <p className="text-xs text-muted-foreground">Sign in to personalise and download your own version.</p>
          </div>
          <Button asChild size="lg">
            <Link href={`/login?next=/templates/${t.slug}`}>
              <Wand2 className="mr-2 size-4" /> Personalise this template
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          This is a public preview with the template’s predefined content. Personalised previews are
          available after signing in.
        </p>
      </div>

      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', href: '/' },
          { name: 'Templates', href: '/templates' },
          { name: t.name, href: `/templates/${t.slug}` },
          { name: 'Preview', href: `/preview/${t.slug}` },
        ])}
      />
    </div>
  );
}
