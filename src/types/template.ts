// Public-facing Template contracts (Stage 4 data layer).
export type TemplateType = 'VIDEO' | 'PDF_SINGLE' | 'PDF_MULTI';
export type TemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type TemplateVisibility = 'PUBLIC' | 'PRIVATE';
export type LanguageCode = 'EN' | 'HI';

export type TemplateSort = 'newest' | 'featured' | 'trending' | 'popular';

export interface TemplateCategoryRef {
  id: string;
  slug: string;
  name: string;
}

export interface TemplateListItem {
  id: string;
  slug: string;
  name: string;
  category: TemplateCategoryRef;
  type: TemplateType;
  language: LanguageCode;
  thumbnail: string;
  demoPreviewUrl: string | null;
  featured: boolean;
  trending: boolean;
  bestSeller: boolean;
  createdAt: string;
}

export interface TemplateDetail extends TemplateListItem {
  description: string;
  tags: string[];
  features: string[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  visibility: TemplateVisibility;
  status: TemplateStatus;
  updatedAt: string;
}

export interface TemplateFilters {
  search?: string;
  categorySlug?: string;
  type?: TemplateType;
  language?: LanguageCode;
  featured?: boolean;
  trending?: boolean;
  bestSeller?: boolean;
}

export interface TemplateListQuery extends TemplateFilters {
  page: number;
  pageSize: number;
  sort: TemplateSort;
}

export interface TemplateListResult {
  items: TemplateListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
