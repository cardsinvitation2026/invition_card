export const DownloadErrorCode = {
  DOWNLOAD_NOT_FOUND: 'DOWNLOAD_NOT_FOUND',
  RENDER_NOT_COMPLETED: 'RENDER_NOT_COMPLETED',
  DOWNLOAD_URL_MISSING: 'DOWNLOAD_URL_MISSING',
  MEMBERSHIP_REQUIRED: 'MEMBERSHIP_REQUIRED',
  DOWNLOAD_LIMIT_REACHED: 'DOWNLOAD_LIMIT_REACHED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type DownloadErrorCode = (typeof DownloadErrorCode)[keyof typeof DownloadErrorCode];

export class DownloadServiceError extends Error {
  readonly code: DownloadErrorCode;

  constructor(code: DownloadErrorCode, message?: string) {
    super(message ?? code);
    this.name = 'DownloadServiceError';
    this.code = code;
  }
}
