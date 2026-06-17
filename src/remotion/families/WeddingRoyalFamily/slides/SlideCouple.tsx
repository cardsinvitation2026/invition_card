'use client';

import { AbsoluteFill } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { fadeUp } from '@/remotion/animations/fadeUp';
import { slideLeft } from '@/remotion/animations/slideLeft';
import { BackgroundLayer } from '@/remotion/layers/BackgroundLayer';
import { TextLayer } from '@/remotion/layers/TextLayer';
import { readFieldValue, type SlideProps } from '@/remotion/types/slide-props';

export function SlideCouple({ values, variantSlug }: SlideProps) {
  const frame = useCurrentFrame();
  const groomName = readFieldValue(values, 'GROOM_NAME');
  const brideName = readFieldValue(values, 'BRIDE_NAME');
  const groomStyle = slideLeft(frame);
  const brideStyle = fadeUp(frame, 36);

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
          gap: 28,
        }}
      >
        <TextLayer size="xl" animateStyle={groomStyle}>
          {groomName}
        </TextLayer>
        <TextLayer size="md" animateStyle={fadeUp(frame, 24)}>
          &amp;
        </TextLayer>
        <TextLayer size="xl" animateStyle={brideStyle}>
          {brideName}
        </TextLayer>
      </div>
    </AbsoluteFill>
  );
}
