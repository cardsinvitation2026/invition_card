import { z } from 'zod';

export const templateTypeSchema = z.enum(['VIDEO', 'PDF_SINGLE', 'PDF_MULTI']);
export const languageCodeSchema = z.enum(['EN', 'HI']);
export const templateSortSchema = z.enum(['newest', 'featured', 'trending', 'popular']);

const boolFlag = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => (typeof v === 'string' ? v === 'true' : v))
  .optional();

export const templateListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  categorySlug: z.string().regex(/^[a-z0-9-]+$/).max(120).optional(),
  type: templateTypeSchema.optional(),
  language: languageCodeSchema.optional(),
  featured: boolFlag,
  trending: boolFlag,
  bestSeller: boolFlag,
  page: z.coerce.number().int().min(1).max(1000).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(12),
  sort: templateSortSchema.default('featured'),
});
export type TemplateListQueryInput = z.infer<typeof templateListQuerySchema>;

export const templateSlugSchema = z.string().min(1).max(160).regex(/^[a-z0-9-]+$/);
