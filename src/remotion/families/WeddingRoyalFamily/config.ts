export const WEDDING_ROYAL_FAMILY_ID = 'WeddingRoyalFamily' as const;

export const WEDDING_ROYAL_SLIDE_DURATIONS = {
  intro: 90,
  couple: 90,
  event: 90,
  closing: 90,
} as const;

export const WEDDING_ROYAL_FAMILY_CONFIG = {
  id: WEDDING_ROYAL_FAMILY_ID,
  fps: 30,
  width: 1080,
  height: 1920,
  slides: WEDDING_ROYAL_SLIDE_DURATIONS,
  durationInFrames:
    WEDDING_ROYAL_SLIDE_DURATIONS.intro +
    WEDDING_ROYAL_SLIDE_DURATIONS.couple +
    WEDDING_ROYAL_SLIDE_DURATIONS.event +
    WEDDING_ROYAL_SLIDE_DURATIONS.closing,
} as const;

export type WeddingRoyalFamilyConfig = typeof WEDDING_ROYAL_FAMILY_CONFIG;
