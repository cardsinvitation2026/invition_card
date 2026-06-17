import { z } from 'zod';

export const renderExecutionInputSchema = z
  .object({
    jobId: z.string().trim().min(1).max(64),
    userId: z.string().trim().min(1).max(64),
    draftId: z.string().trim().min(1).max(64),
    templateId: z.string().trim().min(1).max(64),
  })
  .strict();

export type RenderExecutionInputValidated = z.infer<typeof renderExecutionInputSchema>;
