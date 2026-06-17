import { z } from 'zod';

export const auditEntityIdSchema = z.string().uuid();

export const auditOverviewSchema = z.object({
  observability: z.object({
    health: z.object({
      status: z.string(),
      timestamp: z.string(),
    }),
    queue: z.object({
      pendingJobs: z.number(),
      processingJobs: z.number(),
      completedJobs: z.number(),
      failedJobs: z.number(),
      retryableFailedJobs: z.number(),
    }),
    reliability: z.object({
      pendingJobs: z.number(),
      processingJobs: z.number(),
      completedJobs: z.number(),
      failedJobs: z.number(),
      retryableFailedJobs: z.number(),
    }),
    generatedAt: z.string(),
  }),
  generatedAt: z.string(),
});

export const auditTimelineSchema = z.object({
  subjectId: z.string(),
  subjectType: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  events: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      category: z.string(),
      eventType: z.string(),
      title: z.string(),
      description: z.string(),
      entityId: z.string(),
      metadata: z.record(z.string(), z.unknown()),
    }),
  ),
  generatedAt: z.string(),
});
