// Default SEO configuration and utilities.
import type { Metadata } from 'next';
import { appConfig } from './app.config';

export const defaultSeo: Metadata = {
  title: { default: appConfig.name, template: `%s | ${appConfig.name}` },
  description: appConfig.description,
};

export function buildOpenGraph(params: {
  title: string;
  description?: string;
  url?: string;
  image?: string;
}): NonNullable<Metadata['openGraph']> {
  return {
    title: params.title,
    description: params.description ?? appConfig.description,
    url: params.url,
    siteName: appConfig.name,
    images: params.image ? [{ url: params.image }] : undefined,
    type: 'website',
  };
}

export function buildTwitter(params: {
  title: string;
  description?: string;
  image?: string;
}): NonNullable<Metadata['twitter']> {
  return {
    card: 'summary_large_image',
    title: params.title,
    description: params.description ?? appConfig.description,
    images: params.image ? [params.image] : undefined,
  };
}

export function buildStructuredData(input: Record<string, unknown>): string {
  return JSON.stringify({ '@context': 'https://schema.org', ...input });
}
