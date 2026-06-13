// Google Analytics integration placeholder (client + server façade).
export interface AnalyticsConfig {
  measurementId: string;
}

export class AnalyticsService {
  constructor(private readonly config: AnalyticsConfig | null) {}
  isReady(): boolean {
    return this.config !== null;
  }
  // Future: pageView, track, identify, ...
}

function loadConfig(): AnalyticsConfig | null {
  const measurementId = process.env.NEXT_PUBLIC_GA_ID;
  if (!measurementId) return null;
  return { measurementId };
}

export const analyticsService = new AnalyticsService(loadConfig());
