export function formatRenderDuration(
  createdAt: string,
  completedAt: string | null,
): string | null {
  if (!completedAt) {
    return null;
  }
  const start = new Date(createdAt).getTime();
  const end = new Date(completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return null;
  }
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}
