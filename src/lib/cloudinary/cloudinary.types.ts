export interface CloudinaryVideoUploadOptions {
  jobId: string;
  localFilePath: string;
}

export interface CloudinaryUploadApiResponse {
  secure_url: string;
  public_id: string;
  bytes: number;
  duration?: number;
}

export const CLOUDINARY_RENDER_FOLDER = 'my-invitations/renders' as const;

export const CLOUDINARY_NOT_CONFIGURED_MESSAGE = 'Cloudinary is not configured.' as const;

export const CLOUDINARY_LOCAL_FILE_MISSING_MESSAGE = 'Local render file not found.' as const;
