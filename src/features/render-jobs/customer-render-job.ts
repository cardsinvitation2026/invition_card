import type { RenderJobDetail } from '@/types/render-job';

/** Strip direct Cloudinary URL from customer-facing render job payloads. */
export function redactCustomerRenderJob(job: RenderJobDetail): RenderJobDetail {
  return {
    ...job,
    finalUrl: null,
  };
}

export function redactCustomerRenderJobs(jobs: RenderJobDetail[]): RenderJobDetail[] {
  return jobs.map(redactCustomerRenderJob);
}
