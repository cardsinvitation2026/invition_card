export type AuditEventCategory =
  | 'CUSTOMER'
  | 'PAYMENT'
  | 'MEMBERSHIP'
  | 'RENDER'
  | 'DOWNLOAD'
  | 'SYSTEM';

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: AuditEventCategory;
  eventType: string;
  title: string;
  description: string;
  entityId: string;
  metadata: Readonly<Record<string, unknown>>;
}

export interface AuditTimeline {
  subjectId: string;
  subjectType: string;
  title: string;
  description: string | null;
  events: AuditEvent[];
  generatedAt: string;
}

export interface SystemObservabilitySnapshot {
  health: import('@/types/operations').PublicHealthResponse;
  environment: import('@/types/operations').EnvironmentValidationResult;
  worker: import('@/types/operations').WorkerDiagnosticsSnapshot;
  queue: import('@/types/operations').QueueDiagnosticsSnapshot;
  deployment: import('@/types/operations').DeploymentReadinessResult;
  reliability: import('@/features/render-reliability/render-reliability.types').RenderReliabilityMetricsSnapshot;
  generatedAt: string;
}

export interface AuditOverviewSnapshot {
  observability: SystemObservabilitySnapshot;
  generatedAt: string;
}
