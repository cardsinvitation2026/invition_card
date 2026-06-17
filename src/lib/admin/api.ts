import type { ApiResponse } from '@/types/api';

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export async function adminFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
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
    throw new AdminApiError(
      data.message ?? `Request failed (${res.status})`,
      res.status,
      'errors' in data ? data.errors : undefined,
    );
  }
  return data;
}
