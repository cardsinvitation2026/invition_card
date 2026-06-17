import { z } from 'zod';

export const renderJobStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
]);

export const renderJobCreateSchema = z
  .object({
    draftId: z.string().trim().min(1).max(64),
    templateId: z.string().trim().min(1).max(64),
  })
  .strict();

export const renderJobIdSchema = z.string().trim().min(1).max(64);

export const renderJobListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    draftId: z.string().trim().min(1).max(64).optional(),
    status: renderJobStatusSchema.optional(),
  })
  .strict();

export type RenderJobCreateInput = z.infer<typeof renderJobCreateSchema>;
export type RenderJobListQueryInput = z.infer<typeof renderJobListQuerySchema>;
