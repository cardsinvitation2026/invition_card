import 'server-only';
import { startRenderWorkerRunner } from '@/features/render-worker/render-worker.runner';
import {
  recordWorkerStartedAt,
  recoverStuckProcessingJobs,
} from '@/features/render-reliability';

declare global {
  // eslint-disable-next-line no-var
  var __mi_render_worker_bootstrapped__: boolean | undefined;
}

export async function runRenderWorkerStartupRecovery(): Promise<number> {
  recordWorkerStartedAt();
  return recoverStuckProcessingJobs();
}

export function bootstrapRenderWorker(): void {
  if (globalThis.__mi_render_worker_bootstrapped__) {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  if (process.env.DISABLE_RENDER_WORKER === '1') {
    return;
  }

  globalThis.__mi_render_worker_bootstrapped__ = true;

  void (async () => {
    await runRenderWorkerStartupRecovery();
    startRenderWorkerRunner();
  })();
}
