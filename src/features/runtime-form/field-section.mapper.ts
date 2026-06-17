import type { TemplateField } from '@/types/template-field';
import type { RuntimeField, RuntimeSection } from '@/types/form-runtime';
import {
  FIELD_SECTIONS,
  getSectionConfig,
  resolveSectionKey,
  type FieldSectionKey,
} from '@/config/field-sections';
import { fieldTypeSchema } from '@/validations/template-field.validation';

function parseHelpTextRules(helpText: string | null): {
  minLength: number | null;
  pattern: string | null;
} {
  if (!helpText) {
    return { minLength: null, pattern: null };
  }
  try {
    const parsed: unknown = JSON.parse(helpText);
    if (typeof parsed !== 'object' || parsed === null) {
      return { minLength: null, pattern: null };
    }
    const obj = parsed as Record<string, unknown>;
    const minLength =
      typeof obj.minLength === 'number' && Number.isInteger(obj.minLength) && obj.minLength >= 0
        ? obj.minLength
        : null;
    const pattern = typeof obj.pattern === 'string' && obj.pattern.length > 0 ? obj.pattern : null;
    return { minLength, pattern };
  } catch {
    return { minLength: null, pattern: null };
  }
}

function toRuntimeFieldType(fieldType: string): RuntimeField['fieldType'] {
  const parsed = fieldTypeSchema.safeParse(fieldType);
  return parsed.success ? parsed.data : 'text';
}

export function templateFieldToRuntimeField(field: TemplateField): RuntimeField {
  const sectionKey = resolveSectionKey(field.key);
  const extra = parseHelpTextRules(field.helpText);

  return {
    id: field.id,
    key: field.key,
    label: field.label,
    fieldType: toRuntimeFieldType(field.fieldType),
    required: field.required,
    maxLength: field.maxLength,
    placeholder: field.placeholder,
    helpText: field.helpText,
    sortOrder: field.sortOrder,
    sectionKey,
    validation: {
      required: field.required,
      maxLength: field.maxLength,
      minLength: extra.minLength,
      pattern: extra.pattern,
    },
  };
}

export function sortRuntimeFields(fields: RuntimeField[]): RuntimeField[] {
  return [...fields].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function groupFieldsIntoSections(fields: RuntimeField[]): RuntimeSection[] {
  const sorted = sortRuntimeFields(fields);
  const buckets = new Map<FieldSectionKey, RuntimeField[]>();

  for (const section of FIELD_SECTIONS) {
    buckets.set(section.key, []);
  }

  for (const field of sorted) {
    const key = resolveSectionKey(field.key);
    buckets.get(key)?.push(field);
  }

  return FIELD_SECTIONS.map((section) => ({
    key: section.key,
    label: section.label,
    order: section.order,
    fields: buckets.get(section.key) ?? [],
  })).filter((section) => section.fields.length > 0);
}

export function buildValidationMetadata(
  fields: RuntimeField[],
): Record<string, RuntimeField['validation']> {
  const metadata: Record<string, RuntimeField['validation']> = {};
  for (const field of fields) {
    metadata[field.key] = field.validation;
  }
  return metadata;
}

export { getSectionConfig, resolveSectionKey };
