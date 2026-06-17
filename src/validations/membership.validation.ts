import { z } from 'zod';

export const membershipStatusSchema = z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']);

export const membershipIdSchema = z.string().trim().min(1).max(64);

export const membershipCreateSchema = z
  .object({
    userId: z.string().trim().min(1).max(64),
    planId: z.string().trim().min(1).max(64),
  })
  .strict();

export const membershipUpdateSchema = z
  .object({
    status: membershipStatusSchema,
  })
  .strict();

export const membershipListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    userId: z.string().trim().min(1).max(64).optional(),
    status: membershipStatusSchema.optional(),
  })
  .strict();

export type MembershipCreateInput = z.infer<typeof membershipCreateSchema>;
export type MembershipUpdateInput = z.infer<typeof membershipUpdateSchema>;
export type MembershipListQueryInput = z.infer<typeof membershipListQuerySchema>;
