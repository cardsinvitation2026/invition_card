'use client';

import { useMemo } from 'react';
import type { TemplateDetail } from '@/types/template';
import type { RuntimeFormValues } from '@/types/form-runtime';
import type { FamilyInputProps } from '@/remotion/types/family-input-props';

export function useRuntimePreviewData(
  template: TemplateDetail | null | undefined,
  values: RuntimeFormValues,
  musicUrl: string | null | undefined,
): FamilyInputProps | null {
  return useMemo(() => {
    if (!template) {
      return null;
    }
    return {
      template,
      values,
      musicUrl: musicUrl ?? null,
    };
  }, [template, values, musicUrl]);
}
