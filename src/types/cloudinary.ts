export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  sizeBytes: number;
  durationSeconds: number;
}

export interface CloudinaryVideoUploadInput {
  jobId: string;
  localFilePath: string;
}
