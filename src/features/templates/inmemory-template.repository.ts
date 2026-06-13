import 'server-only';
import type {
  TemplateDetail,
  TemplateListItem,
  TemplateListQuery,
  TemplateListResult,
} from '@/types/template';
import type { TemplateRepository } from './template.repository';
import { templateSeed, type TemplateSeed } from './seed';

function seedToList(t: TemplateSeed): TemplateListItem {
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    category: { id: t.categoryId, slug: t.categorySlug, name: t.categoryName },
    type: t.type,
    language: t.language,
    thumbnail: t.thumbnail,
    demoPreviewUrl: t.demoPreviewUrl,
    featured: t.featured,
    trending: t.trending,
    bestSeller: t.bestSeller,
    createdAt: t.createdAt,
  };
}

function seedToDetail(t: TemplateSeed): TemplateDetail {
  return {
    ...seedToList(t),
    description: t.description,
    tags: t.tags,
    features: t.features,
    seoTitle: t.seoTitle,
    seoDescription: t.seoDescription,
    seoKeywords: t.seoKeywords,
    visibility: t.visibility,
    status: t.status,
    updatedAt: t.updatedAt,
  };
}

function applyFilters(list: TemplateSeed[], q: TemplateListQuery): TemplateSeed[] {
  let out = list.filter((t) => t.status === 'PUBLISHED' && t.visibility === 'PUBLIC');
  if (q.search) {
    const s = q.search.toLowerCase();
    out = out.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.tags.some((tag) => tag.toLowerCase().includes(s)),
    );
  }
  if (q.categorySlug) out = out.filter((t) => t.categorySlug === q.categorySlug);
  if (q.type) out = out.filter((t) => t.type === q.type);
  if (q.language) out = out.filter((t) => t.language === q.language);
  if (q.featured) out = out.filter((t) => t.featured);
  if (q.trending) out = out.filter((t) => t.trending);
  if (q.bestSeller) out = out.filter((t) => t.bestSeller);
  return out;
}

function sortList(list: TemplateSeed[], sort: TemplateListQuery['sort']): TemplateSeed[] {
  const arr = list.slice();
  switch (sort) {
    case 'newest':
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'trending':
      arr.sort((a, b) => Number(b.trending) - Number(a.trending) || b.createdAt.localeCompare(a.createdAt));
      break;
    case 'popular':
      arr.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.createdAt.localeCompare(a.createdAt));
      break;
    case 'featured':
    default:
      arr.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(b.trending) - Number(a.trending) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }
  return arr;
}

function paginate(items: TemplateListItem[], page: number, pageSize: number): TemplateListResult {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

export const inMemoryTemplateRepository: TemplateRepository = {
  async list(query) {
    const filtered = applyFilters(templateSeed, query);
    const sorted = sortList(filtered, query.sort);
    return paginate(sorted.map(seedToList), query.page, query.pageSize);
  },
  async listByCategorySlug(categorySlug, query) {
    return this.list({ ...query, categorySlug });
  },
  async findBySlug(slug) {
    const found = templateSeed.find((t) => t.slug === slug);
    return found ? seedToDetail(found) : null;
  },
  async featured(limit) {
    return sortList(applyFilters(templateSeed, {
      page: 1,
      pageSize: limit,
      sort: 'featured',
      featured: true,
    }), 'featured').slice(0, limit).map(seedToList);
  },
  async trending(limit) {
    return sortList(applyFilters(templateSeed, {
      page: 1,
      pageSize: limit,
      sort: 'trending',
      trending: true,
    }), 'trending').slice(0, limit).map(seedToList);
  },
  async bestSellers(limit) {
    return sortList(applyFilters(templateSeed, {
      page: 1,
      pageSize: limit,
      sort: 'popular',
      bestSeller: true,
    }), 'popular').slice(0, limit).map(seedToList);
  },
};
