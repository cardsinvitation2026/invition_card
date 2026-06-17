'use client';

import { AbsoluteFill } from 'remotion';
import { useCurrentFrame } from 'remotion';
import { zoomIn } from '@/remotion/animations/zoomIn';
import { BackgroundLayer } from '@/remotion/layers/BackgroundLayer';
import { TextLayer } from '@/remotion/layers/TextLayer';
import type { SlideProps } from '@/remotion/types/slide-props';

export function SlideClosing({ variantSlug }: SlideProps) {
  const frame = useCurrentFrame();
  const animateStyle = zoomIn(frame);

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
          We await your presence
        </TextLayer>
      </div>
    </AbsoluteFill>
  );
}
