/**
 * WeddingRoyalFamily field contract.
 * Documentation only — not enforced at runtime.
 */
export const WEDDING_ROYAL_REQUIRED_KEYS = [
  'GROOM_NAME',
  'BRIDE_NAME',
  'EVENT_DATE',
] as const;

export type WeddingRoyalRequiredKey = (typeof WEDDING_ROYAL_REQUIRED_KEYS)[number];
