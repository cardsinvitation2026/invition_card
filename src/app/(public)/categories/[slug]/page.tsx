import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateGrid } from '@/components/templates/TemplateGrid';
import { TemplateFilterBar } from '@/components/templates/TemplateFilterBar';
import { TemplatePagination } from '@/components/templates/TemplatePagination';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { categoryService } from '@/features/categories';
import { templateService } from '@/features/templates';
import { templateListQuerySchema } from '@/validations/template';
import { breadcrumbLd, categoryItemListLd } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 60;

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const category = await categoryService.getBySlug(slug);
  if (!category) return { title: 'Category not found' };
  return {
    title: category.seoTitle ?? `${category.name} invitation templates`,
    description: category.seoDescription ?? category.description ?? undefined,
    keywords: category.seoKeywords ?? undefined,
  };
}

export default async function CategoryDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await categoryService.getBySlug(slug);
  if (!category) notFound();

  const parsed = templateListQuerySchema.parse({ ...sp, categorySlug: slug });
  const [result, categories] = await Promise.all([
    templateService.list(parsed),
    categoryService.listActive(),
  ]);

  return (
    <div className="container py-10">
      <nav className="mb-3 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/categories" className="hover:text-foreground">Categories</Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{category.name}</span>
      </nav>
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{category.name}</h1>
        {category.description && (
          <p className="max-w-2xl text-muted-foreground">{category.description}</p>
        )}
      </header>
      <div className="mb-6">
        <TemplateFilterBar categories={categories} showCategory={false} />
      </div>
      {result.items.length === 0 ? (
        <EmptyState
          title="No templates match these filters"
          description="Try clearing filters or switch language to see more."
          action={<Button asChild variant="outline"><Link href={`/categories/${slug}`}>Clear filters</Link></Button>}
        />
      ) : (
        <>
          <TemplateGrid items={result.items} />
          <TemplatePagination
            page={result.page}
            pageCount={result.pageCount}
            basePath={`/categories/${slug}`}
            searchParams={sp}
          />
          <div className="mt-12 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/templates">See all categories <ArrowRight className="ml-1 size-4" /></Link>
            </Button>
          </div>
        </>
      )}
      <JsonLd
        id="ld-cat-breadcrumb"
        data={breadcrumbLd([
          { name: 'Home', href: '/' },
          { name: 'Categories', href: '/categories' },
          { name: category.name, href: `/categories/${category.slug}` },
        ])}
      />
      <JsonLd id="ld-cat-list" data={categoryItemListLd(category, result.items)} />
    </div>
  );
}
