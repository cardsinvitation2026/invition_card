export type CompositionFamilyId = 'WeddingRoyalFamily';

const COMPOSITION_REGISTRY: Record<string, CompositionFamilyId> = {
  'royal-mandap-gold': 'WeddingRoyalFamily',
  'mehendi-mosaic': 'WeddingRoyalFamily',
  'vintage-roses': 'WeddingRoyalFamily',
  'confetti-pop': 'WeddingRoyalFamily',
  'sweet-sixteen': 'WeddingRoyalFamily',
  'silver-jubilee': 'WeddingRoyalFamily',
  'golden-years': 'WeddingRoyalFamily',
  'diya-glow': 'WeddingRoyalFamily',
};

export function resolveCompositionFamily(slug: string): CompositionFamilyId | null {
  return COMPOSITION_REGISTRY[slug] ?? null;
}

export function isRegistryMappedSlug(slug: string): boolean {
  return slug in COMPOSITION_REGISTRY;
}

export function getRegisteredSlugs(): string[] {
  return Object.keys(COMPOSITION_REGISTRY);
}
