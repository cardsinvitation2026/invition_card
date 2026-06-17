import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryService } from '@/lib/cloudinary/client';
import type { CloudinaryUploadApiResponse } from '@/lib/cloudinary/cloudinary.types';
import {
  CLOUDINARY_NOT_CONFIGURED_MESSAGE,
  CLOUDINARY_RENDER_FOLDER,
} from '@/lib/cloudinary/cloudinary.types';

export interface CloudinaryVideoUploadParams {
  jobId: string;
  localFilePath: string;
}

function ensureCloudinaryConfigured(): void {
  if (!cloudinaryService.isReady()) {
    throw new Error(CLOUDINARY_NOT_CONFIGURED_MESSAGE);
  }
}

function applyCloudinaryConfig(): void {
  const config = cloudinaryService.getConfig();
  if (!config) {
    throw new Error(CLOUDINARY_NOT_CONFIGURED_MESSAGE);
  }
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
    secure: true,
  });
}

export const cloudinaryUploadService = {
  async uploadVideoFile(
    params: CloudinaryVideoUploadParams,
  ): Promise<CloudinaryUploadApiResponse> {
    ensureCloudinaryConfigured();
    applyCloudinaryConfig();

    const result = await cloudinary.uploader.upload(params.localFilePath, {
      resource_type: 'video',
      folder: CLOUDINARY_RENDER_FOLDER,
      public_id: params.jobId,
      overwrite: false,
      unique_filename: true,
      use_filename: false,
      invalidate: false,
    });

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      bytes: result.bytes,
      duration: result.duration,
    };
  },
};
