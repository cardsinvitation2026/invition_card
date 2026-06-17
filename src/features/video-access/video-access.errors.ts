export enum VideoAccessErrorCode {
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  VIDEO_NOT_AVAILABLE = 'VIDEO_NOT_AVAILABLE',
  VIDEO_URL_MISSING = 'VIDEO_URL_MISSING',
  FORBIDDEN = 'FORBIDDEN',
}

export class VideoAccessError extends Error {
  constructor(public readonly code: VideoAccessErrorCode) {
    super(code);
    this.name = 'VideoAccessError';
  }
}
