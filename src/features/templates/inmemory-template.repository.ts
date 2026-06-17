import 'server-only';
import { randomUUID } from 'node:crypto';
import type {
  TemplateAdminListQuery,
  TemplateCountFilters,
  TemplateCreateData,
  TemplateDetail,
  TemplateListItem,
  TemplateListQuery,
  TemplateListResult,
  TemplateUpdateData,
} from '@/types/template';
import type { TemplateRepository } from './template.repository';
import { templateSeed, type TemplateSeed } from './seed';
import { getInMemoryCategoryById } from '@/features/categories/inmemory-category.repository';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_templates__: Map<string, TemplateSeed> | undefined;
}

function store(): Map<string, TemplateSeed> {
  if (!globalThis.__mi_inmem_templates__) {
    const map = new Map<string, TemplateSeed>();
    for (const t of templateSeed) {
      map.set(t.id, { ...t });
    }
    globalThis.__mi_inmem_templates__ = map;
  }
  return globalThis.__mi_inmem_templates__;
}

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
    musicId: t.musicId,
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

function applyPublicFilters(list: TemplateSeed[], q: TemplateListQuery): TemplateSeed[] {
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

function applyAdminFilters(list: TemplateSeed[], q: TemplateAdminListQuery): TemplateSeed[] {
  let out = list.slice();
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
  if (q.language) out = out.filter((t) => t.language === q.language);
  if (q.featured) out = out.filter((t) => t.featured);
  if (q.status) out = out.filter((t) => t.status === q.status);
  if (q.visibility) out = out.filter((t) => t.visibility === q.visibility);
  return out;
}

function applyCountFilters(list: TemplateSeed[], filters: TemplateCountFilters): TemplateSeed[] {
  let out = list.slice();
  if (filters.search) {
    const s = filters.search.toLowerCase();
    out = out.filter(
      (t) =>
        t.name.toLowerCase().includes(s) ||
        t.description.toLowerCase().includes(s) ||
        t.tags.some((tag) => tag.toLowerCase().includes(s)),
    );
  }
  if (filters.categorySlug) out = out.filter((t) => t.categorySlug === filters.categorySlug);
  if (filters.language) out = out.filter((t) => t.language === filters.language);
  if (filters.featured) out = out.filter((t) => t.featured);
  if (filters.status) out = out.filter((t) => t.status === filters.status);
  if (filters.visibility) out = out.filter((t) => t.visibility === filters.visibility);
  return out;
}

function sortPublic(list: TemplateSeed[], sort: TemplateListQuery['sort']): TemplateSeed[] {
  const arr = list.slice();
  switch (sort) {
    case 'newest':
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case 'oldest':
      arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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

function sortAdmin(list: TemplateSeed[], sort: TemplateAdminListQuery['sort']): TemplateSeed[] {
  const arr = list.slice();
  switch (sort) {
    case 'oldest':
      arr.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      break;
    case 'popular':
      arr.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller) || b.createdAt.localeCompare(a.createdAt));
      break;
    case 'trending':
      arr.sort((a, b) => Number(b.trending) - Number(a.trending) || b.createdAt.localeCompare(a.createdAt));
      break;
    case 'featured':
      arr.sort(
        (a, b) =>
          Number(b.featured) - Number(a.featured) ||
          Number(b.trending) - Number(a.trending) ||
          b.createdAt.localeCompare(a.createdAt),
      );
      break;
    case 'newest':
    default:
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
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

function resolveCategoryMeta(categoryId: string): Pick<TemplateSeed, 'categorySlug' | 'categoryName'> {
  const cat = getInMemoryCategoryById(categoryId);
  if (cat) {
    return { categorySlug: cat.slug, categoryName: cat.name };
  }
  const fromTemplate = [...store().values()].find((t) => t.categoryId === categoryId);
  if (fromTemplate) {
    return { categorySlug: fromTemplate.categorySlug, categoryName: fromTemplate.categoryName };
  }
  return { categorySlug: 'uncategorized', categoryName: 'Uncategorized' };
}

export const inMemoryTemplateRepository: TemplateRepository = {
  async create(input: TemplateCreateData) {
    const now = new Date().toISOString();
    const categoryMeta = resolveCategoryMeta(input.categoryId);
    const created: TemplateSeed = {
      id: randomUUID(),
      slug: input.slug,
      name: input.name,
      categoryId: input.categoryId,
      categorySlug: categoryMeta.categorySlug,
      categoryName: categoryMeta.categoryName,
      type: input.type,
      language: input.language,
      thumbnail: input.thumbnail ?? '',
      demoPreviewUrl: input.demoPreviewUrl ?? null,
      description: input.description ?? '',
      tags: [],
      features: [],
      seoTitle: input.seoTitle ?? null,
      seoDescription: input.seoDescription ?? null,
      seoKeywords: input.seoKeywords ?? null,
      musicId: input.musicId ?? null,
      featured: input.featured,
      trending: input.trending,
      bestSeller: input.bestSeller,
      visibility: input.visibility,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    return seedToDetail(created);
  },
  async update(id, input: TemplateUpdateData) {
    const existing = store().get(id);
    if (!existing) throw new Error('Template not found');
    const categoryMeta =
      input.categoryId !== undefined ? resolveCategoryMeta(input.categoryId) : null;
    const updated: TemplateSeed = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined ? { description: input.description ?? '' } : {}),
      ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
      ...(categoryMeta ? { categorySlug: categoryMeta.categorySlug, categoryName: categoryMeta.categoryName } : {}),
      ...(input.thumbnail !== undefined ? { thumbnail: input.thumbnail ?? '' } : {}),
      ...(input.demoPreviewUrl !== undefined ? { demoPreviewUrl: input.demoPreviewUrl } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.language !== undefined ? { language: input.language } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.visibility !== undefined ? { visibility: input.visibility } : {}),
      ...(input.featured !== undefined ? { featured: input.featured } : {}),
      ...(input.trending !== undefined ? { trending: input.trending } : {}),
      ...(input.bestSeller !== undefined ? { bestSeller: input.bestSeller } : {}),
      ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
      ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
      ...(input.seoKeywords !== undefined ? { seoKeywords: input.seoKeywords } : {}),
      ...(input.musicId !== undefined ? { musicId: input.musicId } : {}),
      updatedAt: new Date().toISOString(),
    };
    store().set(id, updated);
    return seedToDetail(updated);
  },
  async delete(id) {
    if (!store().has(id)) throw new Error('Template not found');
    store().delete(id);
  },
  async findById(id) {
    const found = store().get(id);
    return found ? seedToDetail(found) : null;
  },
  async list(query) {
    const filtered = applyPublicFilters([...store().values()], query);
    const sorted = sortPublic(filtered, query.sort);
    return paginate(sorted.map(seedToList), query.page, query.pageSize);
  },
  async listAdmin(query) {
    const filtered = applyAdminFilters([...store().values()], query);
    const sorted = sortAdmin(filtered, query.sort);
    return paginate(sorted.map(seedToList), query.page, query.pageSize);
  },
  async listByCategorySlug(categorySlug, query) {
    return this.list({ ...query, categorySlug });
  },
  async search(query) {
    return this.list({ ...query, search: query.search ?? '' });
  },
  async count(filters) {
    return applyCountFilters([...store().values()], filters).length;
  },
  async findBySlug(slug) {
    const found = [...store().values()].find((t) => t.slug === slug);
    return found ? seedToDetail(found) : null;
  },
  async featured(limit) {
    return sortPublic(applyPublicFilters([...store().values()], {
      page: 1,
      pageSize: limit,
      sort: 'featured',
      featured: true,
    }), 'featured').slice(0, limit).map(seedToList);
  },
  async trending(limit) {
    return sortPublic(applyPublicFilters([...store().values()], {
      page: 1,
      pageSize: limit,
      sort: 'trending',
      trending: true,
    }), 'trending').slice(0, limit).map(seedToList);
  },
  async bestSellers(limit) {
    return sortPublic(applyPublicFilters([...store().values()], {
      page: 1,
      pageSize: limit,
      sort: 'popular',
      bestSeller: true,
    }), 'popular').slice(0, limit).map(seedToList);
  },
};
