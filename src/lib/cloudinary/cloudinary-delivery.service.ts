import 'server-only';
import { createHash } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryService } from '@/lib/cloudinary/client';
import type { SignedVideoUrlResult } from '@/lib/cloudinary/cloudinary-delivery.types';

const DEFAULT_TTL_SECONDS = Number(
  process.env.CLOUDINARY_SIGNED_URL_TTL_SECONDS ?? 3600,
);

function extractPublicId(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  const segments = url.pathname.split('/').filter(Boolean);
  const uploadIndex = segments.indexOf('upload');
  if (uploadIndex === -1) {
    throw new Error('Invalid Cloudinary source URL');
  }

  let index = uploadIndex + 1;
  while (index < segments.length) {
    const segment = segments[index];
    if (/^v\d+$/.test(segment) || segment.startsWith('s--')) {
      index += 1;
      continue;
    }
    break;
  }

  const publicIdWithExtension = segments.slice(index).join('/');
  if (!publicIdWithExtension) {
    throw new Error('Invalid Cloudinary source URL');
  }

  return publicIdWithExtension.replace(/\.[^/.]+$/, '');
}

function signDevDeliveryUrl(sourceUrl: string, expiresAtSec: number): string {
  const url = new URL(sourceUrl);
  url.searchParams.set('_signed', '1');
  url.searchParams.set('_exp', String(expiresAtSec));
  const signature = createHash('sha256')
    .update(`${sourceUrl}:${expiresAtSec}`)
    .digest('hex')
    .slice(0, 16);
  url.searchParams.set('_sig', signature);
  return url.toString();
}

function configureCloudinarySdk(): void {
  const config = cloudinaryService.getConfig();
  if (!config) {
    return;
  }

  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
}

export const cloudinaryDeliveryService = {
  generateSignedVideoUrl(sourceUrl: string): SignedVideoUrlResult {
    const expiresAtSec = Math.floor(Date.now() / 1000) + DEFAULT_TTL_SECONDS;
    const expiresAt = new Date(expiresAtSec * 1000).toISOString();

    if (!cloudinaryService.isReady()) {
      return {
        url: signDevDeliveryUrl(sourceUrl, expiresAtSec),
        expiresAt,
      };
    }

    configureCloudinarySdk();
    const publicId = extractPublicId(sourceUrl);
    const url = cloudinary.url(publicId, {
      resource_type: 'video',
      type: 'upload',
      secure: true,
      sign_url: true,
      expires_at: expiresAtSec,
    });

    return { url, expiresAt };
  },

  isExpired(expiresAt: string): boolean {
    return Date.parse(expiresAt) <= Date.now();
  },

  isSignedDeliveryUrl(url: string): boolean {
    if (url.includes('_signed=1')) {
      return true;
    }
    return /[?&]s--[A-Za-z0-9_-]+--/.test(url) || /[?&]e=\d+/.test(url);
  },
};
