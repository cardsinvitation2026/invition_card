import type { ApiResponse } from '@/types/api';
import type { RenderJobDetail } from '@/types/render-job';

export class RenderJobApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'RenderJobApiError';
  }
}

async function renderJobFetch<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
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
    throw new RenderJobApiError(
      data.message ?? `Request failed (${res.status})`,
      res.status,
      'errors' in data ? data.errors : undefined,
    );
  }
  return data;
}

export async function createRenderJob(input: { draftId: string; templateId: string }) {
  return renderJobFetch<RenderJobDetail>('/api/render-jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
