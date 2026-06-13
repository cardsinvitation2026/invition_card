import type {
  TemplateDetail,
  TemplateListItem,
  TemplateListQuery,
  TemplateListResult,
} from '@/types/template';

export interface TemplateRepository {
  list(query: TemplateListQuery): Promise<TemplateListResult>;
  findBySlug(slug: string): Promise<TemplateDetail | null>;
  listByCategorySlug(
    categorySlug: string,
    query: Omit<TemplateListQuery, 'categorySlug'>,
  ): Promise<TemplateListResult>;
  featured(limit: number): Promise<TemplateListItem[]>;
  trending(limit: number): Promise<TemplateListItem[]>;
  bestSellers(limit: number): Promise<TemplateListItem[]>;
}
