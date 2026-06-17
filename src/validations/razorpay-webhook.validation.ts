import { z } from 'zod';

export const razorpayWebhookPaymentEntitySchema = z
  .object({
    id: z.string().trim().min(1),
    order_id: z.string().trim().min(1),
    amount: z.number().int().nonnegative(),
    currency: z.string().trim().min(1).max(8),
    status: z.string().trim().min(1),
  })
  .strict();

export const razorpayWebhookBodySchema = z
  .object({
    event: z.string().trim().min(1),
    payload: z
      .object({
        payment: z
          .object({
            entity: razorpayWebhookPaymentEntitySchema.optional(),
          })
          .strict()
          .optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type RazorpayWebhookBodyValidated = z.infer<typeof razorpayWebhookBodySchema>;
