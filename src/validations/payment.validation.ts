import { z } from 'zod';

export const paymentStatusSchema = z.enum(['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED']);

export const paymentIdSchema = z.string().trim().min(1).max(64);

export const verifyPaymentSchema = z
  .object({
    orderId: z.string().trim().min(1).max(64),
    planId: z.string().trim().min(1).max(64),
    razorpayOrderId: z.string().trim().min(1).max(128),
    razorpayPaymentId: z.string().trim().min(1).max(128),
    razorpaySignature: z.string().trim().min(1).max(512),
  })
  .strict();

export type VerifyPaymentInputValidated = z.infer<typeof verifyPaymentSchema>;
