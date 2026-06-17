import { z } from 'zod';
import { membershipStatusSchema } from '@/validations/membership.validation';

export const adminMembershipListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: membershipStatusSchema.optional(),
    planId: z.string().trim().min(1).max(64).optional(),
    search: z.string().trim().max(200).optional(),
  })
  .strict();

export type AdminMembershipListQueryInput = z.infer<typeof adminMembershipListQuerySchema>;
