import type { ComponentType } from 'react';
import type { CompositionFamilyId } from '@/remotion/registry/composition-registry';
import type { FamilyInputProps } from '@/remotion/types/family-input-props';
import {
  WeddingRoyalFamily,
  WEDDING_ROYAL_FAMILY_CONFIG,
} from '@/remotion/families/WeddingRoyalFamily';

export interface FamilyCompositionMeta {
  id: CompositionFamilyId;
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
}

export interface FamilyCompositionEntry {
  component: ComponentType<FamilyInputProps>;
  meta: FamilyCompositionMeta;
}

const FAMILY_MAP: Record<CompositionFamilyId, FamilyCompositionEntry> = {
  WeddingRoyalFamily: {
    component: WeddingRoyalFamily,
    meta: WEDDING_ROYAL_FAMILY_CONFIG,
  },
};

export function getFamilyComposition(familyId: CompositionFamilyId): FamilyCompositionEntry {
  return FAMILY_MAP[familyId];
}
