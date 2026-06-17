import { z } from 'zod';
import { orderListQuerySchema } from '@/validations/order.validation';

export const purchaseListQuerySchema = orderListQuerySchema;

export type PurchaseListQueryInput = z.infer<typeof purchaseListQuerySchema>;
