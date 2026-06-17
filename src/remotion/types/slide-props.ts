import type { RuntimeFormValues } from '@/types/form-runtime';

export interface SlideProps {
  values: RuntimeFormValues;
  variantSlug: string;
}

export function readFieldValue(values: RuntimeFormValues, key: string): string {
  const raw = values[key];
  if (raw === undefined || raw === null) {
    return '';
  }
  return String(raw);
}
