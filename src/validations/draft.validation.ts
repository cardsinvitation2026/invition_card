import { z } from 'zod';

export const MAX_DRAFTS_PER_USER = 50;

export const runtimeFormValuesSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()]).optional(),
);

export const draftCreateSchema = z
  .object({
    templateId: z.string().trim().min(1).max(64),
    values: runtimeFormValuesSchema,
  })
  .strict();

export const draftUpdateSchema = z
  .object({
    values: runtimeFormValuesSchema,
  })
  .strict();

export const draftIdSchema = z.string().trim().min(1).max(64);

export const draftListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(200).optional(),
  templateId: z.string().trim().min(1).max(64).optional(),
});

export type DraftCreateInput = z.infer<typeof draftCreateSchema>;
export type DraftUpdateInput = z.infer<typeof draftUpdateSchema>;
export type DraftListQueryInput = z.infer<typeof draftListQuerySchema>;
