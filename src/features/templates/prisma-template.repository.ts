import 'server-only';
import type {
  TemplateDetail,
  TemplateListItem,
  TemplateListQuery,
  TemplateListResult,
} from '@/types/template';
import type { TemplateRepository } from './template.repository';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

interface PrismaTemplateRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
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

function orderBy(sort: TemplateListQuery['sort']) {
  switch (sort) {
    case 'newest':
      return [{ createdAt: 'desc' as const }];
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

function whereFromQuery(q: TemplateListQuery): Prisma.TemplateWhereInput {
  return {
    status: 'PUBLISHED',
    visibility: 'PUBLIC',
    deletedAt: null,
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

export const prismaTemplateRepository: TemplateRepository = {
  async list(query) {
    const where = whereFromQuery(query);
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      db().template.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: orderBy(query.sort),
        include: { category: { select: { id: true, slug: true, name: true } } },
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
  async findBySlug(slug) {
    const row = (await db().template.findUnique({
      where: { slug },
      include: { category: { select: { id: true, slug: true, name: true } } },
    })) as PrismaTemplateRow | null;
    return row ? toDetail(row) : null;
  },
  async featured(limit) {
    const items = (await db().template.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', featured: true, deletedAt: null },
      take: limit,
      orderBy: orderBy('featured'),
      include: { category: { select: { id: true, slug: true, name: true } } },
    })) as PrismaTemplateRow[];
    return items.map(toListItem);
  },
  async trending(limit) {
    const items = (await db().template.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', trending: true, deletedAt: null },
      take: limit,
      orderBy: orderBy('trending'),
      include: { category: { select: { id: true, slug: true, name: true } } },
    })) as PrismaTemplateRow[];
    return items.map(toListItem);
  },
  async bestSellers(limit) {
    const items = (await db().template.findMany({
      where: { status: 'PUBLISHED', visibility: 'PUBLIC', bestSeller: true, deletedAt: null },
      take: limit,
      orderBy: orderBy('popular'),
      include: { category: { select: { id: true, slug: true, name: true } } },
    })) as PrismaTemplateRow[];
    return items.map(toListItem);
  },
};
