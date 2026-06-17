import 'server-only';
import type { CategoryRepository } from './category.repository';
import type { Category, CategoryCreateData, CategoryWithCount } from '@/types/category';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toCategory(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    thumbnail: row.thumbnail,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    seoKeywords: row.seoKeywords,
    sortOrder: row.sortOrder,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function notDeleted() {
  return { deletedAt: null };
}

export const prismaCategoryRepository: CategoryRepository = {
  async create(input: CategoryCreateData) {
    const row = await db().category.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        thumbnail: input.thumbnail ?? null,
        seoTitle: input.seoTitle ?? null,
        seoDescription: input.seoDescription ?? null,
        seoKeywords: input.seoKeywords ?? null,
        sortOrder: input.sortOrder,
        active: input.active,
      },
    });
    return toCategory(row);
  },
  async update(id, input) {
    const row = await db().category.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.thumbnail !== undefined ? { thumbnail: input.thumbnail } : {}),
        ...(input.seoTitle !== undefined ? { seoTitle: input.seoTitle } : {}),
        ...(input.seoDescription !== undefined ? { seoDescription: input.seoDescription } : {}),
        ...(input.seoKeywords !== undefined ? { seoKeywords: input.seoKeywords } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return toCategory(row);
  },
  async delete(id) {
    await db().category.update({
      where: { id },
      data: { deletedAt: new Date(), active: false },
    });
  },
  async list(opts) {
    const where = {
      ...notDeleted(),
      ...(opts?.activeOnly ? { active: true } : {}),
    };
    const rows = await db().category.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { templates: { where: notDeleted() } } } },
    });
    return rows.map(
      (r): CategoryWithCount => ({
        ...toCategory(r),
        templateCount: r._count.templates,
      }),
    );
  },
  async listActive() {
    const rows = await db().category.findMany({
      where: { active: true, ...notDeleted() },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toCategory);
  },
  async findBySlug(slug) {
    const row = await db().category.findFirst({
      where: { slug, ...notDeleted() },
    });
    return row ? toCategory(row) : null;
  },
  async findById(id) {
    const row = await db().category.findFirst({
      where: { id, ...notDeleted() },
    });
    return row ? toCategory(row) : null;
  },
  async count(opts) {
    return db().category.count({
      where: {
        ...notDeleted(),
        ...(opts?.activeOnly ? { active: true } : {}),
      },
    });
  },
};
