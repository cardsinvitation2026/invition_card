export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    return;
  }

  const { bootstrapRenderWorker } = await import('@/server/render-worker.bootstrap');
  bootstrapRenderWorker();
}
