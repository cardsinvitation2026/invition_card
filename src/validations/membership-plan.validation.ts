import { z } from 'zod';

export const membershipPlanIdSchema = z.string().trim().min(1).max(64);

export const membershipPlanCreateSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional().nullable(),
    price: z.number().int().min(0),
    currency: z.string().trim().min(3).max(3).default('INR'),
    validityDays: z.number().int().min(1),
    downloadLimit: z.number().int().min(0).optional().nullable(),
    active: z.boolean().default(true),
    sortOrder: z.number().int().min(0).default(0),
  })
  .strict();

export const membershipPlanUpdateSchema = membershipPlanCreateSchema.partial().strict();

export const membershipPlanListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    active: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
  })
  .strict();

export type MembershipPlanCreateInput = z.infer<typeof membershipPlanCreateSchema>;
export type MembershipPlanUpdateInput = z.infer<typeof membershipPlanUpdateSchema>;
export type MembershipPlanListQueryInput = z.infer<typeof membershipPlanListQuerySchema>;
