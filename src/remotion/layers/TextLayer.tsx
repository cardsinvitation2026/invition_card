import type { CSSProperties } from 'react';
import type { TextLayerProps, TextSize } from '@/remotion/types/layer-props';

const SIZE_MAP: Record<TextSize, number> = {
  sm: 36,
  md: 48,
  lg: 64,
  xl: 80,
};

export function TextLayer({
  children,
  size = 'md',
  animateStyle,
  style,
}: TextLayerProps) {
  const merged: CSSProperties = {
    fontSize: SIZE_MAP[size],
    fontWeight: 400,
    letterSpacing: '0.04em',
    textAlign: 'center',
    color: '#f5e6c8',
    textShadow: '0 2px 12px rgba(0,0,0,0.45)',
    fontFamily: 'Georgia, "Times New Roman", serif',
    ...animateStyle,
    ...style,
  };

  return <div style={merged}>{children}</div>;
}
