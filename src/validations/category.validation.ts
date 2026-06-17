import { z } from 'zod';

const slugRegex = /^[a-z0-9-]+$/;

export const CategoryCreateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(120)
    .regex(slugRegex, 'Slug must be lowercase alphanumeric with hyphens'),
  description: z.string().trim().max(1000).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  thumbnail: z.string().url().max(2048).optional().nullable(),
  seoTitle: z.string().trim().max(200).optional().nullable(),
  seoDescription: z.string().trim().max(500).optional().nullable(),
  seoKeywords: z.string().trim().max(500).optional().nullable(),
}).strict();

export const CategoryUpdateSchema = CategoryCreateSchema.partial().strict();

export const categorySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(slugRegex);

export const categoryIdSchema = z.string().trim().min(1).max(64);

export type CategoryCreateInput = z.infer<typeof CategoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof CategoryUpdateSchema>;
