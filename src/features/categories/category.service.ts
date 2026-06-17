import 'server-only';
import type { CategoryRepository } from './category.repository';
import { prismaCategoryRepository } from './prisma-category.repository';
import { inMemoryCategoryRepository } from './inmemory-category.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type { CategoryCreateInput, CategoryUpdateInput } from '@/validations/category.validation';
import type { CategoryCreateData, CategoryUpdateData } from '@/types/category';

function repo(): CategoryRepository {
  return hasDatabaseUrl() ? prismaCategoryRepository : inMemoryCategoryRepository;
}

function toCreateData(input: CategoryCreateInput): CategoryCreateData {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    thumbnail: input.thumbnail,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    seoKeywords: input.seoKeywords,
    sortOrder: input.sortOrder,
    active: input.isActive,
  };
}

function toUpdateData(input: CategoryUpdateInput): CategoryUpdateData {
  const data: CategoryUpdateData = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.thumbnail !== undefined) data.thumbnail = input.thumbnail;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.seoDescription !== undefined) data.seoDescription = input.seoDescription;
  if (input.seoKeywords !== undefined) data.seoKeywords = input.seoKeywords;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.isActive !== undefined) data.active = input.isActive;
  return data;
}

export const categoryService = {
  async createCategory(input: CategoryCreateInput) {
    return repo().create(toCreateData(input));
  },
  async updateCategory(id: string, input: CategoryUpdateInput) {
    return repo().update(id, toUpdateData(input));
  },
  async deleteCategory(id: string) {
    return repo().delete(id);
  },
  async getCategory(id: string) {
    return repo().findById(id);
  },
  async getCategoryBySlug(slug: string) {
    return repo().findBySlug(slug);
  },
  async listCategories() {
    return repo().list();
  },
  async listActiveCategories() {
    return repo().listActive();
  },
  async countCategories(activeOnly?: boolean) {
    return repo().count(activeOnly ? { activeOnly: true } : undefined);
  },
  // Stage 4 aliases
  async listActive() {
    return repo().list({ activeOnly: true });
  },
  async getBySlug(slug: string) {
    return repo().findBySlug(slug);
  },
  async getById(id: string) {
    return repo().findById(id);
  },
};
