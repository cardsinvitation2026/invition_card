export class DownloadLogQuotaError extends Error {
  readonly code = 'DOWNLOAD_LIMIT_REACHED' as const;

  constructor() {
    super('DOWNLOAD_LIMIT_REACHED');
    this.name = 'DownloadLogQuotaError';
  }
}
