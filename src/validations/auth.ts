// Stage 1: Auth validation schema placeholder.
import { z } from 'zod';

export const emailSchema = z.string().email();
export type Email = z.infer<typeof emailSchema>;
