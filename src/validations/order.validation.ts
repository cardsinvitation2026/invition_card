import { z } from 'zod';

export const orderStatusSchema = z.enum(['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED']);

export const orderIdSchema = z.string().trim().min(1).max(64);

export const createCheckoutOrderSchema = z
  .object({
    planId: z.string().trim().min(1).max(64),
  })
  .strict();

export const orderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: orderStatusSchema.optional(),
  })
  .strict();

export type CreateCheckoutOrderInput = z.infer<typeof createCheckoutOrderSchema>;
export type OrderListQueryInput = z.infer<typeof orderListQuerySchema>;
