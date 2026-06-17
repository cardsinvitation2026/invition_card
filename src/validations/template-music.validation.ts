import { z } from 'zod';

export const CreateMusicSchema = z.object({
  title: z.string().trim().min(1).max(200),
  audioUrl: z.string().url().max(2048),
  durationSeconds: z.number().int().min(0).max(86400).optional().nullable(),
  isDefault: z.boolean().default(false),
  artist: z.string().trim().max(200).optional().nullable(),
  license: z.string().trim().max(200).optional().nullable(),
  active: z.boolean().default(true),
}).strict();

export const UpdateMusicSchema = CreateMusicSchema.partial().strict();

export const templateMusicIdSchema = z.string().trim().min(1).max(64);

export type CreateMusicInput = z.infer<typeof CreateMusicSchema>;
export type UpdateMusicInput = z.infer<typeof UpdateMusicSchema>;
