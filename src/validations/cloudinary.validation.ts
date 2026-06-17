import { z } from 'zod';

export const cloudinaryVideoUploadInputSchema = z
  .object({
    jobId: z.string().trim().min(1).max(64),
    localFilePath: z.string().trim().min(1).max(1024),
  })
  .strict();

export type CloudinaryVideoUploadInputValidated = z.infer<
  typeof cloudinaryVideoUploadInputSchema
>;
