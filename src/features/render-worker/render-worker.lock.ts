import 'server-only';

const lockedJobIds = new Set<string>();

export const renderWorkerLock = {
  isLocked(jobId: string): boolean {
    return lockedJobIds.has(jobId);
  },

  tryClaim(jobId: string): boolean {
    if (lockedJobIds.has(jobId)) {
      return false;
    }
    lockedJobIds.add(jobId);
    return true;
  },

  release(jobId: string): void {
    lockedJobIds.delete(jobId);
  },

  clearAll(): void {
    lockedJobIds.clear();
  },
};
