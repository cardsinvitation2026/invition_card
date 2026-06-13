'use client';

import type { ReactNode } from 'react';

// Stage 1: Empty providers shell. Theme/Query/Auth providers will be added in later stages.
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
