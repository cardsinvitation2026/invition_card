import { z } from 'zod';

export const categorySlugSchema = z.string().min(1).max(120).regex(/^[a-z0-9-]+$/);
