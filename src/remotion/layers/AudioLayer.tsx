import { Audio } from 'remotion';
import type { AudioLayerProps } from '@/remotion/types/layer-props';

export function AudioLayer({ musicUrl }: AudioLayerProps) {
  if (!musicUrl) {
    return null;
  }
  return <Audio src={musicUrl} />;
}
