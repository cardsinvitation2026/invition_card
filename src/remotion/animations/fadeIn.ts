import { interpolate } from 'remotion';

export const FADE_IN_DEFAULT_DURATION = 30;

export function fadeIn(frame: number, durationInFrames = FADE_IN_DEFAULT_DURATION): {
  opacity: number;
} {
  return {
    opacity: interpolate(frame, [0, durationInFrames], [0, 1], {
      extrapolateRight: 'clamp',
    }),
  };
}
