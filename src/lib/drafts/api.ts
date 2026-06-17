import type { ApiResponse } from '@/types/api';
import type { DraftDetailResponse } from '@/types/draft';
import type { RuntimeFormValues } from '@/types/form-runtime';

export class DraftApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'DraftApiError';
  }
}

async function draftFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  const data = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !data.success) {
    throw new DraftApiError(
      data.message ?? `Request failed (${res.status})`,
      res.status,
      'errors' in data ? data.errors : undefined,
    );
  }
  return data;
}

export async function createDraft(templateId: string, values: RuntimeFormValues) {
  return draftFetch<DraftDetailResponse>('/api/drafts', {
    method: 'POST',
    body: JSON.stringify({ templateId, values }),
  });
}

export async function updateDraft(draftId: string, values: RuntimeFormValues) {
  return draftFetch<DraftDetailResponse>(`/api/drafts/${draftId}`, {
    method: 'PUT',
    body: JSON.stringify({ values }),
  });
}

export async function deleteDraft(draftId: string) {
  return draftFetch<null>(`/api/drafts/${draftId}`, { method: 'DELETE' });
}

export async function fetchDraft(draftId: string) {
  return draftFetch<DraftDetailResponse>(`/api/drafts/${draftId}`);
}

export async function fetchDraftsForTemplate(templateId: string) {
  return draftFetch<import('@/types/draft').DraftListResult>(
    `/api/drafts?templateId=${encodeURIComponent(templateId)}&page=1&pageSize=1`,
  );
}
