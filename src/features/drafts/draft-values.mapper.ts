import type { RuntimeFormValues } from '@/types/form-runtime';
import type { TemplateField } from '@/types/template-field';
import type { DraftFieldValueInput, DraftFieldValueRecord } from '@/types/draft';

type FieldLike = Pick<TemplateField, 'id' | 'key' | 'fieldType'>;

export function serializeFieldValue(
  raw: string | number | null | undefined,
): string {
  if (raw === undefined || raw === null) {
    return '';
  }
  return String(raw);
}

export function deserializeFieldValue(
  value: string,
  fieldType: string,
): string | number | undefined {
  if (fieldType === 'number') {
    if (value === '') {
      return undefined;
    }
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return value;
}

export function mergeRuntimeValuesForAllFields(
  values: RuntimeFormValues,
  fields: FieldLike[],
): RuntimeFormValues {
  const merged: RuntimeFormValues = {};
  for (const field of fields) {
    const raw = values[field.key];
    if (field.fieldType === 'number') {
      merged[field.key] =
        raw === undefined || raw === null || raw === ''
          ? undefined
          : typeof raw === 'number'
            ? raw
            : Number(raw);
    } else {
      merged[field.key] =
        raw === undefined || raw === null
          ? ''
          : typeof raw === 'number'
            ? String(raw)
            : raw;
    }
  }
  return merged;
}

export function runtimeValuesToDraftFieldValues(
  values: RuntimeFormValues,
  fields: FieldLike[],
): DraftFieldValueInput[] {
  const merged = mergeRuntimeValuesForAllFields(values, fields);
  return fields.map((field) => ({
    fieldId: field.id,
    value: serializeFieldValue(merged[field.key]),
  }));
}

export function draftFieldValuesToRuntimeValues(
  fieldValues: DraftFieldValueRecord[],
  fields: FieldLike[],
): RuntimeFormValues {
  const byFieldId = new Map(fieldValues.map((fv) => [fv.fieldId, fv.value]));
  const result: RuntimeFormValues = {};

  for (const field of fields) {
    const stored = byFieldId.get(field.id);
    result[field.key] =
      stored === undefined
        ? field.fieldType === 'number'
          ? undefined
          : ''
        : deserializeFieldValue(stored, field.fieldType);
  }

  return result;
}
