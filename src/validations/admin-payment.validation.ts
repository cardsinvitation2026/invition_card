import { z } from 'zod';

export const paymentStatusFilterSchema = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']);

export const adminPaymentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: paymentStatusFilterSchema.optional(),
    planId: z.string().trim().min(1).max(64).optional(),
    search: z.string().trim().max(200).optional(),
  })
  .strict();

export type AdminPaymentListQueryInput = z.infer<typeof adminPaymentListQuerySchema>;
