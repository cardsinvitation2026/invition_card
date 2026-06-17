import type { Category, CategoryCreateData, CategoryUpdateData, CategoryWithCount } from '@/types/category';

export interface CategoryRepository {
  create(input: CategoryCreateData): Promise<Category>;
  update(id: string, input: CategoryUpdateData): Promise<Category>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  list(opts?: { activeOnly?: boolean }): Promise<CategoryWithCount[]>;
  listActive(): Promise<Category[]>;
  count(opts?: { activeOnly?: boolean }): Promise<number>;
}
