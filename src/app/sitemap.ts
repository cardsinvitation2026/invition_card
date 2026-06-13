import type { MetadataRoute } from 'next';
import { categoryService } from '@/features/categories';
import { templateService } from '@/features/templates';

function base(): string {
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, templatesPage1] = await Promise.all([
    categoryService.listActive(),
    templateService.list({ page: 1, pageSize: 48, sort: 'featured' }),
  ]);
  const now = new Date();
  const root = base();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${root}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${root}/templates`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${root}/categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${root}/login`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = cats.map((c) => ({
    url: `${root}/categories/${c.slug}`,
    lastModified: new Date(c.updatedAt),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const templateEntries: MetadataRoute.Sitemap = templatesPage1.items.map((t) => ({
    url: `${root}/templates/${t.slug}`,
    lastModified: new Date(t.createdAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...templateEntries];
}
