import { AbsoluteFill } from 'remotion';
import type { BackgroundLayerProps } from '@/remotion/types/layer-props';

const VARIANT_BACKGROUNDS: Record<string, string> = {
  'royal-mandap-gold': 'linear-gradient(160deg, #1a0f00 0%, #3d2a0a 45%, #5c4012 100%)',
  'royal-maroon': 'linear-gradient(160deg, #1a0508 0%, #4a1020 45%, #6b1830 100%)',
  'royal-red': 'linear-gradient(160deg, #1a0505 0%, #5c1010 45%, #8b1818 100%)',
  'royal-black': 'linear-gradient(160deg, #0a0a0a 0%, #1a1a1a 45%, #2d2d2d 100%)',
};

const DEFAULT_BACKGROUND =
  'linear-gradient(160deg, #1a0f00 0%, #3d2a0a 45%, #5c4012 100%)';

export function BackgroundLayer({ variantSlug }: BackgroundLayerProps) {
  const background = VARIANT_BACKGROUNDS[variantSlug] ?? DEFAULT_BACKGROUND;

  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily: 'Georgia, "Times New Roman", serif',
        color: '#f5e6c8',
      }}
    />
  );
}
