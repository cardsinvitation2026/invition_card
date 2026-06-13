import type { Metadata } from 'next';
import Link from 'next/link';
import { templateListQuerySchema } from '@/validations/template';
import { categoryService } from '@/features/categories';
import { templateService } from '@/features/templates';
import { TemplateGrid } from '@/components/templates/TemplateGrid';
import { TemplateFilterBar } from '@/components/templates/TemplateFilterBar';
import { TemplatePagination } from '@/components/templates/TemplatePagination';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/button';
import { breadcrumbLd } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'All invitation templates',
  description: 'Browse every animated and PDF invitation template — filter by occasion, format and language.',
};

type Search = Promise<Record<string, string | string[] | undefined>>;

export default async function TemplatesPage({ searchParams }: { searchParams: Search }) {
  const sp = await searchParams;
  const parsed = templateListQuerySchema.parse(sp);
  const [result, categories] = await Promise.all([
    templateService.list(parsed),
    categoryService.listActive(),
  ]);

  return (
    <div className="container py-10">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{result.total} templates</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Templates</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Search, filter and pick the invitation template that matches your celebration.</p>
      </header>
      <div className="mb-6">
        <TemplateFilterBar categories={categories} />
      </div>
      {result.items.length === 0 ? (
        <EmptyState
          title="No templates match your filters"
          description="Try a different search term or remove some filters."
          action={<Button asChild variant="outline"><Link href="/templates">Clear all filters</Link></Button>}
        />
      ) : (
        <>
          <TemplateGrid items={result.items} />
          <TemplatePagination
            page={result.page}
            pageCount={result.pageCount}
            basePath="/templates"
            searchParams={sp}
          />
        </>
      )}
      <JsonLd
        data={breadcrumbLd([
          { name: 'Home', href: '/' },
          { name: 'Templates', href: '/templates' },
        ])}
      />
    </div>
  );
}
