import { z } from 'zod';
import type { RuntimeField, RuntimeFormDefinition } from '@/types/form-runtime';

const PHONE_PATTERN = /^[+]?[\d\s()-]{7,20}$/;

function wrapOptional(
  schema: z.ZodString,
  field: RuntimeField,
): z.ZodType<string | undefined> {
  if (field.required) {
    return schema.min(1, `${field.label} is required`);
  }
  return z.union([z.literal(''), schema]);
}

function applyLengthAndPattern(schema: z.ZodString, field: RuntimeField): z.ZodString {
  let next = schema;

  if (field.validation.maxLength !== null) {
    next = next.max(
      field.validation.maxLength,
      `${field.label} must be at most ${field.validation.maxLength} characters`,
    );
  }

  if (field.validation.minLength !== null) {
    next = next.min(
      field.validation.minLength,
      `${field.label} must be at least ${field.validation.minLength} characters`,
    );
  }

  if (field.validation.pattern) {
    try {
      const regex = new RegExp(field.validation.pattern);
      next = next.regex(regex, `${field.label} format is invalid`);
    } catch {
      // Ignore invalid stored patterns.
    }
  }

  return next;
}

function buildFieldZodSchema(field: RuntimeField): z.ZodType {
  switch (field.fieldType) {
    case 'email': {
      const typed = applyLengthAndPattern(
        z.string().email(`${field.label} must be a valid email`),
        field,
      );
      return wrapOptional(typed, field);
    }
    case 'phone': {
      const typed = applyLengthAndPattern(
        z.string().regex(PHONE_PATTERN, `${field.label} must be a valid phone number`),
        field,
      );
      return wrapOptional(typed, field);
    }
    case 'url':
    case 'image': {
      const typed = applyLengthAndPattern(
        z.string().url(`${field.label} must be a valid URL`),
        field,
      );
      return wrapOptional(typed, field);
    }
    case 'number': {
      return z.preprocess(
        (val) => {
          if (val === '' || val === null || val === undefined) return undefined;
          if (typeof val === 'number') return val;
          const n = Number(val);
          return Number.isNaN(n) ? val : n;
        },
        field.required
          ? z.number({ message: `${field.label} is required` })
          : z.union([z.undefined(), z.number()]),
      );
    }
    case 'date':
    case 'textarea':
    case 'text':
    default: {
      const typed = applyLengthAndPattern(z.string(), field);
      return wrapOptional(typed, field);
    }
  }
}

export function buildFormZodSchema(
  definition: RuntimeFormDefinition,
): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};

  for (const field of definition.fields) {
    shape[field.key] = buildFieldZodSchema(field);
  }

  return z.object(shape);
}

export function buildDefaultFormValues(
  definition: RuntimeFormDefinition,
): Record<string, string | number | undefined> {
  const values: Record<string, string | number | undefined> = {};
  for (const field of definition.fields) {
    values[field.key] = field.fieldType === 'number' ? undefined : '';
  }
  return values;
}

export { buildFieldZodSchema };
