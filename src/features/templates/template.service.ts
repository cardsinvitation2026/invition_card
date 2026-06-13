import 'server-only';
import type { TemplateRepository } from './template.repository';
import { prismaTemplateRepository } from './prisma-template.repository';
import { inMemoryTemplateRepository } from './inmemory-template.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type { TemplateListQueryInput } from '@/validations/template';
import type { TemplateListQuery } from '@/types/template';

function repo(): TemplateRepository {
  return hasDatabaseUrl() ? prismaTemplateRepository : inMemoryTemplateRepository;
}

function toQuery(input: TemplateListQueryInput): TemplateListQuery {
  return {
    search: input.search,
    categorySlug: input.categorySlug,
    type: input.type,
    language: input.language,
    featured: input.featured,
    trending: input.trending,
    bestSeller: input.bestSeller,
    page: input.page,
    pageSize: input.pageSize,
    sort: input.sort,
  };
}

export const templateService = {
  async list(input: TemplateListQueryInput) {
    return repo().list(toQuery(input));
  },
  async listByCategorySlug(categorySlug: string, input: TemplateListQueryInput) {
    return repo().listByCategorySlug(categorySlug, toQuery({ ...input, categorySlug }));
  },
  async getBySlug(slug: string) {
    return repo().findBySlug(slug);
  },
  async featured(limit = 6) {
    return repo().featured(limit);
  },
  async trending(limit = 6) {
    return repo().trending(limit);
  },
  async bestSellers(limit = 6) {
    return repo().bestSellers(limit);
  },
};
