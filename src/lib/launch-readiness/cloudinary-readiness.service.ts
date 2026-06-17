import 'server-only';
import { cloudinaryService } from '@/lib/cloudinary/client';
import { cloudinaryDeliveryService } from '@/lib/cloudinary/cloudinary-delivery.service';
import { createReadinessCheck } from '@/lib/launch-readiness/readiness.types';
import type { CloudinaryReadinessSnapshot } from '@/types/launch-readiness';

export function evaluateCloudinaryReadiness(): CloudinaryReadinessSnapshot {
  const configured = cloudinaryService.isReady();
  let signedDeliveryAvailable = false;

  try {
    const signed = cloudinaryDeliveryService.generateSignedVideoUrl(
      'https://res.cloudinary.com/demo/video/upload/v1/launch-readiness-probe.mp4',
    );
    signedDeliveryAvailable = Boolean(signed.url && signed.expiresAt);
  } catch {
    signedDeliveryAvailable = false;
  }

  const uploadConfigured = configured;

  const checks = [
    createReadinessCheck({
      id: 'cloudinary_configured',
      label: 'Cloudinary configuration',
      status: configured ? 'pass' : 'fail',
      critical: true,
      message: configured
        ? 'Cloudinary credentials configured'
        : 'Cloudinary credentials missing',
    }),
    createReadinessCheck({
      id: 'cloudinary_signed_delivery',
      label: 'Signed URL generation',
      status: signedDeliveryAvailable ? 'pass' : 'fail',
      critical: true,
      message: signedDeliveryAvailable
        ? 'Signed delivery service operational'
        : 'Signed delivery unavailable',
    }),
    createReadinessCheck({
      id: 'cloudinary_upload',
      label: 'Video upload configuration',
      status: uploadConfigured ? 'pass' : 'fail',
      critical: true,
      message: uploadConfigured
        ? 'Upload credentials available'
        : 'Upload credentials unavailable',
    }),
  ];

  return {
    checks,
    configured,
    signedDeliveryAvailable,
    uploadConfigured,
  };
}

export const cloudinaryReadinessService = {
  evaluateCloudinaryReadiness,
};
