import { resolveCompositionFamily } from '@/remotion/registry/composition-registry';
import { getFamilyComposition } from '@/remotion/families';
import type { CompositionFamilyId } from '@/remotion/registry/composition-registry';
import type { FamilyCompositionEntry } from '@/remotion/families';

export interface ResolvedComposition {
  familyId: CompositionFamilyId;
  entry: FamilyCompositionEntry;
}

export function resolveCompositionForTemplateSlug(
  templateSlug: string,
): ResolvedComposition | null {
  const familyId = resolveCompositionFamily(templateSlug);
  if (!familyId) {
    return null;
  }
  return {
    familyId,
    entry: getFamilyComposition(familyId),
  };
}
