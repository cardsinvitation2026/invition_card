import type {
  TemplateAdminListQuery,
  TemplateCountFilters,
  TemplateCreateData,
  TemplateDetail,
  TemplateListItem,
  TemplateListQuery,
  TemplateListResult,
  TemplateUpdateData,
} from '@/types/template';

export interface TemplateRepository {
  create(input: TemplateCreateData): Promise<TemplateDetail>;
  update(id: string, input: TemplateUpdateData): Promise<TemplateDetail>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<TemplateDetail | null>;
  findBySlug(slug: string): Promise<TemplateDetail | null>;
  list(query: TemplateListQuery): Promise<TemplateListResult>;
  listAdmin(query: TemplateAdminListQuery): Promise<TemplateListResult>;
  listByCategorySlug(
    categorySlug: string,
    query: Omit<TemplateListQuery, 'categorySlug'>,
  ): Promise<TemplateListResult>;
  search(query: TemplateListQuery): Promise<TemplateListResult>;
  count(filters: TemplateCountFilters): Promise<number>;
  featured(limit: number): Promise<TemplateListItem[]>;
  trending(limit: number): Promise<TemplateListItem[]>;
  bestSellers(limit: number): Promise<TemplateListItem[]>;
}
