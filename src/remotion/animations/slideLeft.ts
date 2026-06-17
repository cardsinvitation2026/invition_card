import { interpolate } from 'remotion';

export const SLIDE_LEFT_DEFAULT_DURATION = 30;

export function slideLeft(frame: number, durationInFrames = SLIDE_LEFT_DEFAULT_DURATION): {
  opacity: number;
  transform: string;
} {
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const translateX = interpolate(frame, [0, durationInFrames], [120, 0], {
    extrapolateRight: 'clamp',
  });
  return {
    opacity,
    transform: `translateX(${translateX}px)`,
  };
}
