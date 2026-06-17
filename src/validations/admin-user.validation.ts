import { z } from 'zod';

export const adminUserRoleFilterSchema = z.enum(['USER', 'SUPER_ADMIN']);

export const adminUserMembershipFilterSchema = z.enum(['has_active', 'no_active']);

export const adminUserListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    role: adminUserRoleFilterSchema.optional(),
    membership: adminUserMembershipFilterSchema.optional(),
    search: z.string().trim().max(200).optional(),
  })
  .strict();

export type AdminUserListQueryInput = z.infer<typeof adminUserListQuerySchema>;
