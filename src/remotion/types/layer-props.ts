import type { CSSProperties } from 'react';

export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

export interface TextLayerProps {
  children: string;
  size?: TextSize;
  animateStyle?: CSSProperties;
  style?: CSSProperties;
}

export interface BackgroundLayerProps {
  variantSlug: string;
}

export interface AudioLayerProps {
  musicUrl: string | null | undefined;
}
