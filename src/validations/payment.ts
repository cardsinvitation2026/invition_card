// Stage 1: Payment validation placeholder.
import { z } from 'zod';
export const amountSchema = z.number().int().positive();
