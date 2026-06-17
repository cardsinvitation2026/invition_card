import 'server-only';
import type {
  TemplateAdminListQuery,
  TemplateCountFilters,
  TemplateCreateData,
  TemplateDetail,
  TemplateListItem,
  TemplateListQuery,
  TemplateUpdateData,
} from '@/types/template';
import type { TemplateRepository } from './template.repository';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

const categorySelect = { id: true, slug: true, name: true } as const;

interface PrismaTemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  musicId: string | null;
  type: string;
  language: string;
  status: string;
  visibility: string;
  thumbnail: string | null;
  demoPreviewUrl: string | null;
  featured: boolean;
  trending: boolean;
  bestSeller: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: string; slug: string; name: string };
}

function toListItem(r: PrismaTemplateRow): TemplateListItem {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    category: r.category,
    type: r.type as TemplateListItem['type'],
    language: r.language as TemplateListItem['language'],
    thumbnail: r.thumbnail ?? '',
    demoPreviewUrl: r.demoPreviewUrl,
    featured: r.featured,
    trending: r.trending,
    bestSeller: r.bestSeller,
    createdAt: r.createdAt.toISOString(),
  };
}

function toDetail(r: PrismaTemplateRow): TemplateDetail {
  return {
    ...toListItem(r),
    description: r.description ?? '',
    musicId: r.musicId,
    tags: [],
    features: [],
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
    seoKeywords: r.seoKeywords,
    visibility: r.visibility as TemplateDetail['visibility'],
    status: r.status as TemplateDetail['status'],
    updatedAt: r.updatedAt.toISOString(),
  };
}

function notDeleted() {
  return { deletedAt: null };
}

function publicOrderBy(sort: TemplateListQuery['sort']) {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' as const }];
    case 'oldest':
      return [{ createdAt: 'asc' as const }];
    case 'trending':
      return [{ trending: 'desc' as const }, { createdAt: 'desc' as const }];
    case 'popular':
      return [{ bestSeller: 'desc' as const }, { createdAt: 'desc' as const }];
    case 'featured':
    default:
      return [
        { featured: 'desc' as const },
        { trending: 'desc' as const },
        { createdAt: 'desc' as const },
      ];
  }
}

function adminOrderBy(sort: TemplateAdminListQuery['sort']) {
  switch (sort) {
    case 'oldest':
      return [{ createdAt: 'asc' as const }];
    case 'popular':
      return [{ bestSeller: 'desc' as const }, { createdAt: 'desc' as const }];
    case 'trending':
      return [{ trending: 'desc' as const }, { createdAt: 'desc' as const }];
    case 'featured':
      return [
        { featured: 'desc' as const },
        { trending: 'desc' as const },
        { createdAt: 'desc' as const },
      ];
    case 'newest':
    default:
      return [{ createdAt: 'desc' as const }];
  }
}

function whereFromPublicQuery(q: TemplateListQuery): Prisma.TemplateWhereInput {
  return {
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    ...notDeleted(),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' as const } },
            { description: { contains: q.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(q.categorySlug ? { category: { slug: q.categorySlug } } : {}),
    ...(q.type ? { type: q.type } : {}),
    ...(q.language ? { language: q.language } : {}),
    ...(q.featured ? { featured: true } : {}),
    ...(q.trending ? { trending: true } : {}),
    ...(q.bestSeller ? { bestSeller: true } : {}),
  };
}

function whereFromAdminQuery(q: TemplateAdminListQuery): Prisma.TemplateWhereInput {
  return {
    ...notDeleted(),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: 'insensitive' as const } },
            { description: { contains: q.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(q.categorySlug ? { category: { slug: q.categorySlug } } : {}),
    ...(q.language ? { language: q.language } : {}),
    ...(q.featured ? { featured: true } : {}),
    ...(q.status ? { status: q.status } : {}),
    ...(q.visibility ? { visibility: q.visibility } : {}),
  };
}

function whereFromCount(filters: TemplateCountFilters): Prisma.TemplateWhereInput {
  return {
    ...notDeleted(),
    ...(filters.search
      ? {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { description: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(filters.categorySlug ? { category: { slug: filters.categorySlug } } : {}),
    ...(filters.language ? { language: filters.language } : {}),
    ...(filters.featured ? { featured: true } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.visibility ? { visibility: filters.visibility } : {}),
  };
}

async function fetchDetail(id: string): Promise<TemplateDetail | null> {
  const row = (await db().template.findFirst({
    where: { id, ...notDeleted() },
    include: { category: { select: categorySelect } },
  })) as PrismaTemplateRow | null;
  return row ? toDetail(row) : null;
}

function createData(input: TemplateCreateData) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description ?? null,
    categoryId: input.categoryId,
    musicId: input.musicId ?? null,
    thumbnail: input.thumbnail ?? null,
    demoPreviewUrl: input.demoPreviewUrl ?? null,
    type: input.type,
    language: input.language,
    status: input.status,
    visibility: input.visibility,
    featured: input.featured,
    trending: input.trending,
    bestSeller: input.bestSeller,
    seoTitle: input.seoTitle ?? null,
    seoDescription: input.seoDescription ?? null,
    seoKeywords: input.seoKeywords ?? null,
  };
}

function updateData(input: TemplateUpdateData) {
  return {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.slug !== undefined ? { slug: input.slug } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
    ...(input.musicId !== undefined ? { musicId: input.musicId } : {}),
    ...(input.thumbnail !== undefined ? { thumbnail: input.thumbnail } : {}),
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
  };
}

export const prismaTemplateRepository: TemplateRepository = {
  async create(input) {
    const row = await db().template.create({
      data: createData(input),
      include: { category: { select: categorySelect } },
    });
    return toDetail(row as PrismaTemplateRow);
  },
  async update(id, input) {
    const row = await db().template.update({
      where: { id },
      data: updateData(input),
      include: { category: { select: categorySelect } },
    });
    return toDetail(row as PrismaTemplateRow);
  },
  async delete(id) {
    await db().template.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
  },
  async findById(id) {
    return fetchDetail(id);
  },
  async findBySlug(slug) {
    const row = (await db().template.findFirst({
      where: { slug, ...notDeleted() },
      include: { category: { select: categorySelect } },
    })) as PrismaTemplateRow | null;
    return row ? toDetail(row) : null;
  },
  async list(query) {
    const where = whereFromPublicQuery(query);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      db().template.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: publicOrderBy(query.sort),
        include: { category: { select: categorySelect } },
      }) as Promise<PrismaTemplateRow[]>,
      db().template.count({ where }),
    ]);
    return {
      items: items.map(toListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },
  async listAdmin(query) {
    const where = whereFromAdminQuery(query);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      db().template.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: adminOrderBy(query.sort),
        include: { category: { select: categorySelect } },
      }) as Promise<PrismaTemplateRow[]>,
      db().template.count({ where }),
    ]);
    return {
      items: items.map(toListItem),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },
  async listByCategorySlug(categorySlug, query) {
    return this.list({ ...query, categorySlug });
  },
  async search(query) {
    return this.list({ ...query, search: query.search ?? '' });
  },
  async count(filters) {
    return db().template.count({ where: whereFromCount(filters) });
  },
  async featured(limit) {
    const items = (await db().template.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', featured: true, ...notDeleted() },
      take: limit,
      orderBy: publicOrderBy('featured'),
      include: { category: { select: categorySelect } },
    })) as PrismaTemplateRow[];
    return items.map(toListItem);
  },
  async trending(limit) {
    const items = (await db().template.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', trending: true, ...notDeleted() },
      take: limit,
      orderBy: publicOrderBy('trending'),
      include: { category: { select: categorySelect } },
    })) as PrismaTemplateRow[];
    return items.map(toListItem);
  },
  async bestSellers(limit) {
    const items = (await db().template.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', bestSeller: true, ...notDeleted() },
      take: limit,
      orderBy: publicOrderBy('popular'),
      include: { category: { select: categorySelect } },
    })) as PrismaTemplateRow[];
    return items.map(toListItem);
  },
};
