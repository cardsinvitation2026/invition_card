import type { Category, CategoryWithCount } from '@/types/category';

export interface CategoryRepository {
  list(opts?: { activeOnly?: boolean }): Promise<CategoryWithCount[]>;
  findBySlug(slug: string): Promise<Category | null>;
  findById(id: string): Promise<Category | null>;
}
