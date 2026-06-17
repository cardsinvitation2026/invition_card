import type {
  PreviewDataObject,
  RuntimeField,
  RuntimeFormValues,
} from '@/types/form-runtime';

export function buildPreviewData(
  values: RuntimeFormValues,
  fields: RuntimeField[],
): PreviewDataObject {
  const result: PreviewDataObject = {};

  for (const field of fields) {
    const raw = values[field.key];
    if (raw === undefined || raw === null || raw === '') {
      continue;
    }
    result[field.key] = typeof raw === 'number' ? raw : String(raw);
  }

  return result;
}
