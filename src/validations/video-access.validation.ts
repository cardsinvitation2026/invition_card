import { z } from 'zod';

export const videoAccessRenderJobIdSchema = z.string().uuid();
export const videoAccessDownloadLogIdSchema = z.string().uuid();
