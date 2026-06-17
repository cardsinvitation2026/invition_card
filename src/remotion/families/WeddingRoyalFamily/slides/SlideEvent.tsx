'use client';

import { AbsoluteFill } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { fadeIn } from '@/remotion/animations/fadeIn';
import { slideRight } from '@/remotion/animations/slideRight';
import { BackgroundLayer } from '@/remotion/layers/BackgroundLayer';
import { TextLayer } from '@/remotion/layers/TextLayer';
import { readFieldValue, type SlideProps } from '@/remotion/types/slide-props';

export function SlideEvent({ values, variantSlug }: SlideProps) {
  const frame = useCurrentFrame();
  const eventDate = readFieldValue(values, 'EVENT_DATE');

  return (
    <AbsoluteFill>
      <BackgroundLayer variantSlug={variantSlug} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 64,
          gap: 24,
        }}
      >
        <TextLayer size="md" animateStyle={fadeIn(frame, 24)}>
          Save the date
        </TextLayer>
        <TextLayer size="lg" animateStyle={slideRight(frame)}>
          {eventDate}
        </TextLayer>
      </div>
    </AbsoluteFill>
  );
}
