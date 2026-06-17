import 'server-only';
import { recordLastPollAt } from '@/features/render-reliability';
import { RENDER_WORKER_POLL_INTERVAL_MS } from '@/features/render-worker/render-worker.constants';
import { renderWorkerService } from '@/features/render-worker/render-worker.service';
import type { RenderWorkerRunnerState } from '@/features/render-worker/render-worker.types';

function resolvePollIntervalMs(): number {
  const raw = process.env.RENDER_WORKER_POLL_INTERVAL_MS;
  if (!raw) {
    return RENDER_WORKER_POLL_INTERVAL_MS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 100) {
    return RENDER_WORKER_POLL_INTERVAL_MS;
  }
  return parsed;
}

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let activePoll: Promise<void> | null = null;
let stopped = true;
let running = false;
let pollCount = 0;
let lastPollAt: string | null = null;
let shutdownHooksRegistered = false;

async function runPollCycle(): Promise<void> {
  if (stopped || activePoll) {
    return;
  }

  activePoll = (async () => {
    try {
      pollCount += 1;
      lastPollAt = new Date().toISOString();
      recordLastPollAt(lastPollAt);
      await renderWorkerService.processPendingJobs();
    } catch (error) {
      console.error(
        'Render worker poll cycle failed:',
        error instanceof Error ? error.message : error,
      );
    } finally {
      activePoll = null;
    }
  })();

  await activePoll;
}

function registerShutdownHooks(): void {
  if (shutdownHooksRegistered) {
    return;
  }
  shutdownHooksRegistered = true;

  const shutdown = () => {
    void stopRenderWorkerRunner().finally(() => {
      process.exit(0);
    });
  };

  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

export function startRenderWorkerRunner(): void {
  if (running) {
    return;
  }

  running = true;
  stopped = false;
  registerShutdownHooks();

  void runPollCycle();
  intervalHandle = setInterval(() => {
    void runPollCycle();
  }, resolvePollIntervalMs());
}

export async function stopRenderWorkerRunner(): Promise<void> {
  stopped = true;
  running = false;

  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }

  if (activePoll) {
    await activePoll;
  }
}

export function getRenderWorkerRunnerState(): RenderWorkerRunnerState {
  return {
    running,
    stopped,
    polling: activePoll !== null,
    pollCount,
    lastPollAt,
  };
}
