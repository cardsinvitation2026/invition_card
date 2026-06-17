import type {
  DownloadLog,
  DownloadLogCreateData,
  DownloadLogListQuery,
  DownloadLogPageResult,
} from '@/types/download-log';

export interface DownloadLogRepository {
  findById(id: string): Promise<DownloadLog | null>;
  findByIdForUser(id: string, userId: string): Promise<DownloadLog | null>;
  listByUser(userId: string, query: DownloadLogListQuery): Promise<DownloadLogPageResult>;
  create(input: DownloadLogCreateData): Promise<DownloadLog>;
  recordDownloadWithQuotaConsumption(input: DownloadLogCreateData): Promise<DownloadLog>;
}
