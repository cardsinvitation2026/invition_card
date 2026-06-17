import { interpolate } from 'remotion';

export const FADE_UP_DEFAULT_DURATION = 30;

export function fadeUp(frame: number, durationInFrames = FADE_UP_DEFAULT_DURATION): {
  opacity: number;
  transform: string;
} {
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateY = interpolate(frame, [0, durationInFrames], [48, 0], {
    extrapolateRight: 'clamp',
  });
  return {
    opacity,
    transform: `translateY(${translateY}px)`,
  };
}
