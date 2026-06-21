/**
 * Render worker entry for a separate Node process (dev + prod).
 * Keeps @remotion/bundler out of the Next.js webpack instrumentation bundle.
 */
import { bootstrapRenderWorker } from '../src/server/render-worker.bootstrap';

bootstrapRenderWorker();

console.log('[render-worker] Background worker started');
