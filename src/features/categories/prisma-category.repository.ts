import 'server-only';
import type { Category, CategoryWithCount } from '@/types/category';
import type { CategoryRepository } from './category.repository';
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

export const prismaCategoryRepository: CategoryRepository = {
  async list(opts) {
    const rows = await db().category.findMany({
      where: opts?.activeOnly ? { active: true, deletedAt: null } : undefined,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: { _count: { select: { templates: true } } },
    });
    return rows.map((r) => ({
      ...toCategory(r),
      templateCount: r._count.templates,
    })) as CategoryWithCount[];
  },
  async findBySlug(slug) {
    const row = await db().category.findUnique({ where: { slug } });
    return row ? toCategory(row) : null;
  },
  async findById(id) {
    const row = await db().category.findUnique({ where: { id } });
    return row ? toCategory(row) : null;
  },
};
