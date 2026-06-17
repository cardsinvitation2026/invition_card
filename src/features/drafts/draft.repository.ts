import type {
  DraftCreateData,
  DraftDetail,
  DraftFieldValueRecord,
  DraftListQuery,
  DraftListResult,
  DraftUpdateData,
  DraftWithValues,
} from '@/types/draft';

export interface DraftRepository {
  create(input: DraftCreateData): Promise<DraftWithValues>;
  update(id: string, userId: string, input: DraftUpdateData): Promise<DraftWithValues>;
  delete(id: string, userId: string): Promise<void>;
  findById(id: string, userId: string): Promise<DraftWithValues | null>;
  findByUserAndTemplate(userId: string, templateId: string): Promise<DraftWithValues | null>;
  listByUser(userId: string, query: DraftListQuery): Promise<DraftListResult>;
  countByUser(userId: string): Promise<number>;
}

export type { DraftDetail, DraftFieldValueRecord, DraftWithValues };
