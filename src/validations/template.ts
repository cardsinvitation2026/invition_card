// Stage 1: Template validation placeholder.
import { z } from 'zod';
export const templateSlugSchema = z.string().min(1).max(120);
