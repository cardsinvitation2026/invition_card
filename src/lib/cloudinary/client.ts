// Cloudinary integration placeholder. Real upload methods land in Stage N.
import 'server-only';

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

export class CloudinaryService {
  constructor(private readonly config: CloudinaryConfig | null) {}

  isReady(): boolean {
    return this.config !== null;
  }

  // Future: uploadImage, uploadVideo, deleteAsset, signedUploadParams, ...
}

function loadConfig(): CloudinaryConfig | null {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

export const cloudinaryService = new CloudinaryService(loadConfig());
