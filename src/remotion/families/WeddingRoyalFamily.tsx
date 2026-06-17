'use client';

import { AbsoluteFill, Sequence } from 'remotion';
import type { FamilyInputProps } from '@/remotion/types/family-input-props';
import { AudioLayer } from '@/remotion/layers/AudioLayer';
import { WEDDING_ROYAL_FAMILY_CONFIG } from '@/remotion/families/WeddingRoyalFamily/config';
import { SlideIntro } from '@/remotion/families/WeddingRoyalFamily/slides/SlideIntro';
import { SlideCouple } from '@/remotion/families/WeddingRoyalFamily/slides/SlideCouple';
import { SlideEvent } from '@/remotion/families/WeddingRoyalFamily/slides/SlideEvent';
import { SlideClosing } from '@/remotion/families/WeddingRoyalFamily/slides/SlideClosing';

export { WEDDING_ROYAL_FAMILY_ID, WEDDING_ROYAL_FAMILY_CONFIG } from '@/remotion/families/WeddingRoyalFamily/config';

export function WeddingRoyalFamily({ template, values, musicUrl }: FamilyInputProps) {
  const slideProps = {
    values,
    variantSlug: template.slug,
  };

  const { slides } = WEDDING_ROYAL_FAMILY_CONFIG;
  const introFrom = 0;
  const coupleFrom = introFrom + slides.intro;
  const eventFrom = coupleFrom + slides.couple;
  const closingFrom = eventFrom + slides.event;

  return (
    <AbsoluteFill>
      <AudioLayer musicUrl={musicUrl} />
      <Sequence from={introFrom} durationInFrames={slides.intro}>
        <SlideIntro {...slideProps} />
      </Sequence>
      <Sequence from={coupleFrom} durationInFrames={slides.couple}>
        <SlideCouple {...slideProps} />
      </Sequence>
      <Sequence from={eventFrom} durationInFrames={slides.event}>
        <SlideEvent {...slideProps} />
      </Sequence>
      <Sequence from={closingFrom} durationInFrames={slides.closing}>
        <SlideClosing {...slideProps} />
      </Sequence>
    </AbsoluteFill>
  );
}
