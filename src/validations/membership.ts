// Stage 1: Membership validation placeholder.
import { z } from 'zod';
export const membershipTierSchema = z.enum(['free', 'basic', 'premium']);
