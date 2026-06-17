import { Composition } from 'remotion';
import { registerRoot } from 'remotion';
import type { ComponentType } from 'react';
import {
  WeddingRoyalFamily,
  WEDDING_ROYAL_FAMILY_CONFIG,
} from '@/remotion/families/WeddingRoyalFamily';
import type { FamilyInputProps } from '@/remotion/types/family-input-props';
import type { TemplateDetail } from '@/types/template';

const DEFAULT_TEMPLATE: TemplateDetail = {
  id: 'render-entry-default',
  slug: 'royal-mandap-gold',
  name: 'Render Entry Default',
  category: { id: 'cat', slug: 'wedding', name: 'Wedding' },
  type: 'VIDEO',
  language: 'EN',
  thumbnail: '',
  demoPreviewUrl: null,
  featured: false,
  trending: false,
  bestSeller: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  description: '',
  musicId: null,
  tags: [],
  features: [],
  seoTitle: null,
  seoDescription: null,
  seoKeywords: null,
  visibility: 'PUBLIC',
  status: 'PUBLISHED',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const DEFAULT_INPUT_PROPS: FamilyInputProps = {
  template: DEFAULT_TEMPLATE,
  values: {},
  musicUrl: null,
};

const RemotionRoot = () => {
  return (
    <Composition
      id={WEDDING_ROYAL_FAMILY_CONFIG.id}
      component={
        WeddingRoyalFamily as ComponentType<unknown> as ComponentType<Record<string, unknown>>
      }
      durationInFrames={WEDDING_ROYAL_FAMILY_CONFIG.durationInFrames}
      fps={WEDDING_ROYAL_FAMILY_CONFIG.fps}
      width={WEDDING_ROYAL_FAMILY_CONFIG.width}
      height={WEDDING_ROYAL_FAMILY_CONFIG.height}
      defaultProps={DEFAULT_INPUT_PROPS as unknown as Record<string, unknown>}
    />
  );
};

registerRoot(RemotionRoot);
