import { z } from 'zod';

export const fieldTypeSchema = z.enum([
  'text',
  'textarea',
  'date',
  'number',
  'image',
  'email',
  'phone',
  'url',
]);

export const validationRulesSchema = z
  .object({
    maxLength: z.number().int().positive().optional(),
    minLength: z.number().int().min(0).optional(),
    pattern: z.string().max(500).optional(),
  })
  .passthrough()
  .optional()
  .nullable();

export const CreateFieldSchema = z.object({
  templateId: z.string().trim().min(1).max(64),
  fieldKey: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[A-Z][A-Z0-9_]*$/, 'Field key must be UPPER_SNAKE_CASE'),
  fieldLabel: z.string().trim().min(1).max(200),
  fieldType: fieldTypeSchema.default('text'),
  placeholder: z.string().trim().max(300).optional().nullable(),
  required: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  validationRules: validationRulesSchema,
}).strict();

export const UpdateFieldSchema = CreateFieldSchema.omit({ templateId: true }).partial().strict();

export const templateFieldIdSchema = z.string().trim().min(1).max(64);

export const reorderFieldsSchema = z.object({
  templateId: z.string().trim().min(1).max(64),
  fieldIds: z.array(z.string().trim().min(1).max(64)).min(1),
});

export type CreateFieldInput = z.infer<typeof CreateFieldSchema>;
export type UpdateFieldInput = z.infer<typeof UpdateFieldSchema>;
export type ReorderFieldsInput = z.infer<typeof reorderFieldsSchema>;
