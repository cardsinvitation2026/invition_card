import 'server-only';
import fs from 'node:fs';
import type { CloudinaryUploadResult } from '@/types/cloudinary';
import { cloudinaryVideoUploadInputSchema } from '@/validations/cloudinary.validation';
import { cloudinaryUploadService } from '@/lib/cloudinary/cloudinary-upload.service';
import {
  CLOUDINARY_LOCAL_FILE_MISSING_MESSAGE,
  CLOUDINARY_NOT_CONFIGURED_MESSAGE,
} from '@/lib/cloudinary/cloudinary.types';
import { cloudinaryService } from '@/lib/cloudinary/client';

function mapUploadResponse(response: {
  secure_url: string;
  public_id: string;
  bytes: number;
  duration?: number;
}): CloudinaryUploadResult {
  return {
    url: response.secure_url,
    publicId: response.public_id,
    sizeBytes: response.bytes,
    durationSeconds: response.duration ?? 0,
  };
}

export const cloudinaryVideoService = {
  async uploadRenderVideo(input: {
    jobId: string;
    localFilePath: string;
  }): Promise<CloudinaryUploadResult> {
    const parsed = cloudinaryVideoUploadInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new Error('Invalid Cloudinary upload input');
    }

    if (!cloudinaryService.isReady()) {
      throw new Error(CLOUDINARY_NOT_CONFIGURED_MESSAGE);
    }

    if (!fs.existsSync(parsed.data.localFilePath)) {
      throw new Error(CLOUDINARY_LOCAL_FILE_MISSING_MESSAGE);
    }

    const response = await cloudinaryUploadService.uploadVideoFile({
      jobId: parsed.data.jobId,
      localFilePath: parsed.data.localFilePath,
    });

    return mapUploadResponse(response);
  },
};
