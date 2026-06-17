'use client';

import dynamic from 'next/dynamic';
import { useMemo, type ComponentType } from 'react';
import type { FamilyInputProps } from '@/remotion/types/family-input-props';
import { resolveCompositionFamily } from '@/remotion/registry/composition-registry';
import { getFamilyComposition } from '@/remotion/families';
import type { TemplateType } from '@/types/template';

const RemotionPlayer = dynamic(
  () => import('@remotion/player').then((mod) => mod.Player),
  { ssr: false },
);

export function PersonalizedRemotionPreview({
  templateSlug,
  templateType,
  inputProps,
}: {
  templateSlug: string;
  templateType: TemplateType;
  inputProps: FamilyInputProps | null;
}) {
  const familyId = useMemo(() => resolveCompositionFamily(templateSlug), [templateSlug]);

  const entry = useMemo(() => {
    if (!familyId) {
      return null;
    }
    return getFamilyComposition(familyId);
  }, [familyId]);

  if (templateType !== 'VIDEO') {
    return (
      <div className="flex aspect-[9/16] max-h-[min(80vh,720px)] items-center justify-center rounded-xl border bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Live video preview is available for video templates only.
        </p>
      </div>
    );
  }

  if (!familyId || !entry || !inputProps) {
    return (
      <div className="flex aspect-[9/16] max-h-[min(80vh,720px)] items-center justify-center rounded-xl border bg-muted p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Live preview is not configured for this template yet.
        </p>
      </div>
    );
  }

  const { component: FamilyComponent, meta } = entry;

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border bg-black shadow-lg">
      <RemotionPlayer
        component={FamilyComponent as ComponentType<unknown> as ComponentType<Record<string, unknown>>}
        inputProps={inputProps as unknown as Record<string, unknown>}
        durationInFrames={meta.durationInFrames}
        fps={meta.fps}
        compositionWidth={meta.width}
        compositionHeight={meta.height}
        style={{
          width: '100%',
          aspectRatio: `${meta.width} / ${meta.height}`,
        }}
        controls
        loop
        autoPlay
        clickToPlay={false}
      />
    </div>
  );
}
