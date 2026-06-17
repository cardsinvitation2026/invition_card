import { interpolate } from 'remotion';

export const ZOOM_IN_DEFAULT_DURATION = 30;

export function zoomIn(frame: number, durationInFrames = ZOOM_IN_DEFAULT_DURATION): {
  opacity: number;
  transform: string;
} {
  const opacity = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const scale = interpolate(frame, [0, durationInFrames], [0.85, 1], {
    extrapolateRight: 'clamp',
  });
  return {
    opacity,
    transform: `scale(${scale})`,
  };
}
