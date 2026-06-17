import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Eye, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PreviewPlayer } from '@/components/preview/PreviewPlayer';
import { TemplateGrid } from '@/components/templates/TemplateGrid';
import { templateService } from '@/features/templates';
import { breadcrumbLd, templateCreativeWorkLd } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const t = await templateService.getBySlug(slug);
  if (!t) return { title: 'Template not found' };
  return {
    title: t.seoTitle ?? t.name,
    description: t.seoDescription ?? t.description,
    keywords: t.seoKeywords ?? t.tags.join(', '),
    openGraph: { images: [t.thumbnail] },
  };
}

export default async function TemplateDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const t = await templateService.getBySlug(slug);
  if (!t) notFound();

  const related = await templateService.list({
    page: 1,
    pageSize: 4,
    sort: 'featured',
    categorySlug: t.category.slug,
  });
  const relatedItems = related.items.filter((i) => i.id !== t.id).slice(0, 4);

  return (
    <div className="container py-8">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/templates" className="hover:text-foreground">Templates</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/categories/${t.category.slug}`} className="hover:text-foreground">{t.category.name}</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{t.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Media */}
        <div className="lg:col-span-3">
          <div className="aspect-[4/5] overflow-hidden rounded-xl border bg-muted lg:aspect-video">
            <PreviewPlayer thumbnail={t.thumbnail} videoUrl={t.demoPreviewUrl} alt={t.name} />
          </div>
        </div>

        {/* Meta */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t.category.name}</Badge>
              <Badge variant="outline">{t.language === 'HI' ? 'हिंदी' : 'English'}</Badge>
              <Badge variant="outline">{t.type === 'VIDEO' ? 'Video' : t.type === 'PDF_SINGLE' ? 'PDF' : 'PDF Set'}</Badge>
              {t.featured && <Badge className="bg-amber-500 hover:bg-amber-500">Featured</Badge>}
              {t.trending && <Badge className="bg-rose-500 hover:bg-rose-500">Trending</Badge>}
              {t.bestSeller && <Badge className="bg-emerald-500 hover:bg-emerald-500">Best seller</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">{t.name}</h1>
            <p className="mt-3 text-muted-foreground">{t.description}</p>
          </div>

          <Card>
            <CardContent className="space-y-4 p-5">
              <Button asChild size="lg" className="w-full">
                <Link href={`/templates/${t.slug}/edit`}>
                  <Wand2 className="mr-2 size-4" /> Personalise this template
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link href={`/preview/${t.slug}`}>
                  <Eye className="mr-2 size-4" /> Watch public preview
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Sign in is required only to edit or download. Public preview works without an account.
              </p>
            </CardContent>
          </Card>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">What’s included</h3>
            <ul className="mt-3 space-y-2">
              {t.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 text-primary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {t.tags.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Tags</h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {relatedItems.length > 0 && (
        <>
          <Separator className="my-12" />
          <section>
            <div className="mb-6 flex items-end justify-between">
              <h2 className="text-2xl font-semibold tracking-tight">More {t.category.name} templates</h2>
              <Button asChild variant="ghost" size="sm">
                <Link href={`/categories/${t.category.slug}`}>
                  See all <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            </div>
            <TemplateGrid items={relatedItems} />
          </section>
        </>
      )}

      <JsonLd
        id="ld-template-breadcrumb"
        data={breadcrumbLd([
          { name: 'Home', href: '/' },
          { name: 'Templates', href: '/templates' },
          { name: t.category.name, href: `/categories/${t.category.slug}` },
          { name: t.name, href: `/templates/${t.slug}` },
        ])}
      />
      <JsonLd id="ld-template" data={templateCreativeWorkLd(t)} />
    </div>
  );
}
