'use client';

import { useAuthContext } from '@/providers/AuthProvider';

export function useCurrentUser() {
  return useAuthContext();
}
