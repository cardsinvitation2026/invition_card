'use client';

import { AbsoluteFill } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { fadeIn } from '@/remotion/animations/fadeIn';
import { BackgroundLayer } from '@/remotion/layers/BackgroundLayer';
import { TextLayer } from '@/remotion/layers/TextLayer';
import type { SlideProps } from '@/remotion/types/slide-props';

export function SlideIntro({ variantSlug }: SlideProps) {
  const frame = useCurrentFrame();
  const animateStyle = fadeIn(frame);

  return (
    <AbsoluteFill>
      <BackgroundLayer variantSlug={variantSlug} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 64,
        }}
      >
        <TextLayer size="lg" animateStyle={animateStyle}>
          You are cordially invited
        </TextLayer>
      </div>
    </AbsoluteFill>
  );
}
