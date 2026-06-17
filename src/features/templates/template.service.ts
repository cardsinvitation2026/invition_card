import 'server-only';
import type { TemplateRepository } from './template.repository';
import { prismaTemplateRepository } from './prisma-template.repository';
import { inMemoryTemplateRepository } from './inmemory-template.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type {
  TemplateCreateInput,
  TemplatePublicListQueryInput,
  TemplateAdminListQueryInput,
  TemplateUpdateInput,
} from '@/validations/template.validation';
import type {
  TemplateAdminListQuery,
  TemplateCountFilters,
  TemplateCreateData,
  TemplateListQuery,
  TemplateUpdateData,
} from '@/types/template';
import { templatePublicListQuerySchema, templateAdminListQuerySchema } from '@/validations/template.validation';

function repo(): TemplateRepository {
  return hasDatabaseUrl() ? prismaTemplateRepository : inMemoryTemplateRepository;
}

function toCreateData(input: TemplateCreateInput): TemplateCreateData {
  return {
    name: input.title,
    slug: input.slug,
    description: input.description,
    categoryId: input.categoryId,
    musicId: input.musicId,
    thumbnail: input.thumbnailUrl,
    demoPreviewUrl: input.previewVideoUrl,
    type: input.templateType,
    language: input.language,
    status: input.status,
    visibility: input.visibility,
    featured: input.isFeatured,
    trending: input.trending,
    bestSeller: input.bestSeller,
    seoTitle: input.metaTitle,
    seoDescription: input.metaDescription,
    seoKeywords: input.keywords,
  };
}

function toUpdateData(input: TemplateUpdateInput): TemplateUpdateData {
  const data: TemplateUpdateData = {};
  if (input.title !== undefined) data.name = input.title;
  if (input.slug !== undefined) data.slug = input.slug;
  if (input.description !== undefined) data.description = input.description;
  if (input.categoryId !== undefined) data.categoryId = input.categoryId;
  if (input.musicId !== undefined) data.musicId = input.musicId;
  if (input.thumbnailUrl !== undefined) data.thumbnail = input.thumbnailUrl;
  if (input.previewVideoUrl !== undefined) data.demoPreviewUrl = input.previewVideoUrl;
  if (input.templateType !== undefined) data.type = input.templateType;
  if (input.language !== undefined) data.language = input.language;
  if (input.status !== undefined) data.status = input.status;
  if (input.visibility !== undefined) data.visibility = input.visibility;
  if (input.isFeatured !== undefined) data.featured = input.isFeatured;
  if (input.trending !== undefined) data.trending = input.trending;
  if (input.bestSeller !== undefined) data.bestSeller = input.bestSeller;
  if (input.metaTitle !== undefined) data.seoTitle = input.metaTitle;
  if (input.metaDescription !== undefined) data.seoDescription = input.metaDescription;
  if (input.keywords !== undefined) data.seoKeywords = input.keywords;
  return data;
}

function toPublicQuery(input: TemplatePublicListQueryInput): TemplateListQuery {
  const parsed = templatePublicListQuerySchema.parse(input);
  return {
    search: parsed.search,
    categorySlug: parsed.categorySlug,
    type: parsed.type,
    language: parsed.language,
    featured: parsed.featured,
    trending: parsed.trending,
    bestSeller: parsed.bestSeller,
    page: parsed.page,
    pageSize: parsed.pageSize,
    sort: parsed.sort,
  };
}

function toAdminQuery(input: TemplateAdminListQueryInput): TemplateAdminListQuery {
  const parsed = templateAdminListQuerySchema.parse(input);
  return {
    search: parsed.search,
    categorySlug: parsed.categorySlug,
    language: parsed.language,
    featured: parsed.featured,
    status: parsed.status,
    visibility: parsed.visibility,
    page: parsed.page,
    pageSize: parsed.pageSize,
    sort: parsed.sort,
  };
}

export const templateService = {
  async createTemplate(input: TemplateCreateInput) {
    return repo().create(toCreateData(input));
  },
  async updateTemplate(id: string, input: TemplateUpdateInput) {
    return repo().update(id, toUpdateData(input));
  },
  async deleteTemplate(id: string) {
    return repo().delete(id);
  },
  async getTemplate(id: string) {
    return repo().findById(id);
  },
  async getTemplateBySlug(slug: string) {
    return repo().findBySlug(slug);
  },
  async listTemplates(input: TemplatePublicListQueryInput) {
    return repo().list(toPublicQuery(input));
  },
  async listTemplatesAdmin(input: TemplateAdminListQueryInput) {
    return repo().listAdmin(toAdminQuery(input));
  },
  async listFeaturedTemplates(limit = 6) {
    return repo().featured(limit);
  },
  async listTrendingTemplates(limit = 6) {
    return repo().trending(limit);
  },
  async listByCategory(categorySlug: string, input: TemplatePublicListQueryInput) {
    return repo().listByCategorySlug(categorySlug, toPublicQuery({ ...input, categorySlug }));
  },
  async searchTemplates(input: TemplatePublicListQueryInput) {
    return repo().search(toPublicQuery(input));
  },
  async countTemplates(filters: TemplateCountFilters = {}) {
    return repo().count(filters);
  },
  // Stage 4 aliases
  async list(input: TemplatePublicListQueryInput) {
    return repo().list(toPublicQuery(input));
  },
  async listByCategorySlug(categorySlug: string, input: TemplatePublicListQueryInput) {
    return repo().listByCategorySlug(categorySlug, toPublicQuery({ ...input, categorySlug }));
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
