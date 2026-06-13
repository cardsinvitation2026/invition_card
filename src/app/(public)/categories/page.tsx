import type { Metadata } from 'next';
import Link from 'next/link';
import { CategoryCard } from '@/components/categories/CategoryCard';
import { categoryService } from '@/features/categories';
import { breadcrumbLd } from '@/lib/seo/structured-data';
import { JsonLd } from '@/components/seo/JsonLd';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { Button } from '@/components/ui/button';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Categories',
  description: 'Browse invitation templates by occasion — weddings, engagements, birthdays, anniversaries and house warming.',
};

export default async function CategoriesPage() {
  const items = await categoryService.listActive();
  return (
    <div className="container py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">All occasions</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Categories</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Pick the occasion you’re celebrating and we’ll match it with the perfect template.</p>
      </header>
      {items.length === 0 ? (
        <EmptyState
          title="No categories yet"
          description="We’re curating beautiful categories. Check back soon."
          action={<Button asChild><Link href="/templates">Browse all templates</Link></Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => <CategoryCard key={c.id} category={c} />)}
        </div>
      )}
      <JsonLd data={breadcrumbLd([
        { name: 'Home', href: '/' },
        { name: 'Categories', href: '/categories' },
      ])} />
    </div>
  );
}
