import 'server-only';
import type { CategoryRepository } from './category.repository';
import { prismaCategoryRepository } from './prisma-category.repository';
import { inMemoryCategoryRepository } from './inmemory-category.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';

function repo(): CategoryRepository {
  return hasDatabaseUrl() ? prismaCategoryRepository : inMemoryCategoryRepository;
}

export const categoryService = {
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
