import type { RuntimeFormValues } from '@/types/form-runtime';

export interface DraftListItem {
  id: string;
  templateId: string;
  templateName: string;
  templateSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftDetail {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftFieldValueRecord {
  id: string;
  draftId: string;
  fieldId: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftFieldValueInput {
  fieldId: string;
  value: string;
}

export interface DraftWithValues extends DraftDetail {
  fieldValues: DraftFieldValueRecord[];
}

export interface DraftCreateData {
  userId: string;
  templateId: string;
  title: string;
  values: DraftFieldValueInput[];
}

export interface DraftUpdateData {
  title?: string;
  values: DraftFieldValueInput[];
}

export interface DraftListQuery {
  page: number;
  pageSize: number;
  search?: string;
  templateId?: string;
}

export interface DraftListResult {
  items: DraftListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface DraftDetailResponse {
  draft: DraftDetail;
  fieldValues: DraftFieldValueRecord[];
  values: RuntimeFormValues;
}
