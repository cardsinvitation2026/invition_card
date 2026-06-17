import { z } from 'zod';
import { renderJobStatusSchema } from '@/validations/render-job.validation';

export const adminRenderJobListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
    status: renderJobStatusSchema.optional(),
    templateId: z.string().trim().min(1).max(64).optional(),
    search: z.string().trim().max(200).optional(),
  })
  .strict();

export type AdminRenderJobListQueryInput = z.infer<typeof adminRenderJobListQuerySchema>;
