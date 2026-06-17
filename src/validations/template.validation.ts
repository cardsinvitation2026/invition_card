import { z } from 'zod';

const slugRegex = /^[a-z0-9-]+$/;

export const templateTypeSchema = z.enum(['VIDEO', 'PDF_SINGLE', 'PDF_MULTI']);
export const languageCodeSchema = z.enum(['EN', 'HI']);
export const templateStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const templateVisibilitySchema = z.enum(['PUBLIC', 'PRIVATE']);

export const templatePublicSortSchema = z.enum([
  'newest',
  'oldest',
  'featured',
  'trending',
  'popular',
]);

export const templateAdminSortSchema = z.enum([
  'newest',
  'oldest',
  'featured',
  'trending',
  'popular',
]);

const boolFlag = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => (typeof v === 'string' ? v === 'true' : v))
  .optional();

export const TemplateCreateSchema = z.object({
  title: z.string().trim().min(2).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(160)
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(5000).optional().nullable(),
  categoryId: z.string().trim().min(1).max(64),
  thumbnailUrl: z.string().url().max(2048).optional().nullable(),
  previewVideoUrl: z.string().url().max(2048).optional().nullable(),
  language: languageCodeSchema.default('EN'),
  templateType: templateTypeSchema,
  visibility: templateVisibilitySchema.default('PUBLIC'),
  status: templateStatusSchema.default('DRAFT'),
  isFeatured: z.boolean().default(false),
  metaTitle: z.string().trim().max(200).optional().nullable(),
  metaDescription: z.string().trim().max(500).optional().nullable(),
  keywords: z.string().trim().max(500).optional().nullable(),
  musicId: z.string().trim().min(1).max(64).optional().nullable(),
  trending: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
}).strict();

export const TemplateUpdateSchema = TemplateCreateSchema.partial().strict();

export const templateSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(slugRegex);

export const templateIdSchema = z.string().trim().min(1).max(64);

export const templatePublicListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    categorySlug: z
      .string()
      .trim()
      .regex(slugRegex)
      .max(120)
      .optional(),
    category: z
      .string()
      .trim()
      .regex(slugRegex)
      .max(120)
      .optional(),
    type: templateTypeSchema.optional(),
    language: languageCodeSchema.optional(),
    featured: boolFlag,
    trending: boolFlag,
    bestSeller: boolFlag,
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).optional(),
    limit: z.coerce.number().int().min(1).max(48).optional(),
    sort: templatePublicSortSchema.default('featured'),
  })
  .transform((v) => ({
    search: v.search,
    categorySlug: v.categorySlug ?? v.category,
    type: v.type,
    language: v.language,
    featured: v.featured,
    trending: v.trending,
    bestSeller: v.bestSeller,
    page: v.page,
    pageSize: v.pageSize ?? v.limit ?? 12,
    sort: v.sort,
  }));

export const templateAdminListQuerySchema = z
  .object({
    search: z.string().trim().max(120).optional(),
    categorySlug: z
      .string()
      .trim()
      .regex(slugRegex)
      .max(120)
      .optional(),
    category: z
      .string()
      .trim()
      .regex(slugRegex)
      .max(120)
      .optional(),
    language: languageCodeSchema.optional(),
    featured: boolFlag,
    status: templateStatusSchema.optional(),
    visibility: templateVisibilitySchema.optional(),
    page: z.coerce.number().int().min(1).max(1000).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
    sort: templateAdminSortSchema.default('newest'),
  })
  .transform((v) => ({
    search: v.search,
    categorySlug: v.categorySlug ?? v.category,
    language: v.language,
    featured: v.featured,
    status: v.status,
    visibility: v.visibility,
    page: v.page,
    pageSize: v.pageSize ?? v.limit ?? 20,
    sort: v.sort,
  }));

export type TemplateCreateInput = z.infer<typeof TemplateCreateSchema>;
export type TemplateUpdateInput = z.infer<typeof TemplateUpdateSchema>;
export type TemplatePublicListQueryInput = z.input<typeof templatePublicListQuerySchema>;
export type TemplateAdminListQueryInput = z.input<typeof templateAdminListQuerySchema>;
