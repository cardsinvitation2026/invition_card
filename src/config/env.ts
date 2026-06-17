// Environment variable schema (Stage 1: schema only, not parsed at runtime).
import { z } from 'zod';

export const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().optional(),

  // Auth / session
  NEXTAUTH_SECRET: z.string().optional(),
  AUTH_SESSION_SECRET: z.string().optional(),

  // Firebase Auth (client-side public)
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().optional(),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // Resend
  RESEND_API_KEY: z.string().optional(),

  // Google Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),

  // Public base URL
  NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Intentionally no parse() call yet. Will be enabled when integrations are wired.
