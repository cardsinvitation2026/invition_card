// JSON-LD structured-data builders. Pure functions — safe to call in RSCs.
import type { Category } from '@/types/category';
import type { TemplateDetail, TemplateListItem } from '@/types/template';
import { appConfig } from '@/config/app.config';

function base(name: string) {
  return process.env.NEXT_PUBLIC_BASE_URL
    ? new URL(name, process.env.NEXT_PUBLIC_BASE_URL).toString()
    : name;
}

export function organizationLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: appConfig.name,
    url: base('/'),
    sameAs: [] as string[],
  };
}

export function websiteLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: appConfig.name,
    url: base('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base('/templates')}?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbLd(items: ReadonlyArray<{ name: string; href: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: base(it.href),
    })),
  };
}

export function categoryItemListLd(category: Category, templates: TemplateListItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    url: base(`/categories/${category.slug}`),
    numberOfItems: templates.length,
    itemListElement: templates.map((t, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: base(`/templates/${t.slug}`),
      name: t.name,
    })),
  };
}

export function templateCreativeWorkLd(t: TemplateDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: t.name,
    url: base(`/templates/${t.slug}`),
    image: t.thumbnail,
    description: t.description,
    inLanguage: t.language === 'HI' ? 'hi' : 'en',
    keywords: t.tags.join(', '),
    genre: t.category.name,
  };
}
