// Public-facing Category contract (Stage 4 data layer).
export interface Category {
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
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithCount extends Category {
  templateCount: number;
}

export interface CategoryCreateData {
  name: string;
  slug: string;
  description?: string | null;
  thumbnail?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  sortOrder: number;
  active: boolean;
}

export type CategoryUpdateData = Partial<CategoryCreateData>;
