// Stage 7 presentation-only section mapping. No persistence.

export type FieldSectionKey = 'groom' | 'bride' | 'family' | 'event' | 'other';

export interface FieldSectionConfig {
  key: FieldSectionKey;
  label: string;
  prefix: string;
  order: number;
}

export const FIELD_SECTIONS: readonly FieldSectionConfig[] = [
  { key: 'groom', label: 'Groom Details', prefix: 'GROOM_', order: 1 },
  { key: 'bride', label: 'Bride Details', prefix: 'BRIDE_', order: 2 },
  { key: 'family', label: 'Family Details', prefix: 'FAMILY_', order: 3 },
  { key: 'event', label: 'Event Details', prefix: 'EVENT_', order: 4 },
  { key: 'other', label: 'Other', prefix: '', order: 5 },
] as const;

const PREFIX_SECTIONS = FIELD_SECTIONS.filter((s) => s.prefix.length > 0).sort(
  (a, b) => b.prefix.length - a.prefix.length,
);

export function resolveSectionKey(fieldKey: string): FieldSectionKey {
  const upper = fieldKey.toUpperCase();
  for (const section of PREFIX_SECTIONS) {
    if (upper.startsWith(section.prefix)) {
      return section.key;
    }
  }
  return 'other';
}

export function getSectionConfig(key: FieldSectionKey): FieldSectionConfig {
  const found = FIELD_SECTIONS.find((s) => s.key === key);
  return found ?? FIELD_SECTIONS[FIELD_SECTIONS.length - 1];
}
