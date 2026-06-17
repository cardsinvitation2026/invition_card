import 'server-only';
import type { TemplateFieldRepository } from './template-field.repository';
import type { TemplateField } from '@/types/template-field';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toField(row: {
  id: string;
  templateId: string;
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  maxLength: number | null;
  placeholder: string | null;
  helpText: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): TemplateField {
  return {
    id: row.id,
    templateId: row.templateId,
    key: row.key,
    label: row.label,
    fieldType: row.fieldType,
    required: row.required,
    maxLength: row.maxLength,
    placeholder: row.placeholder,
    helpText: row.helpText,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const prismaTemplateFieldRepository: TemplateFieldRepository = {
  async create(input) {
    const row = await db().templateField.create({
      data: {
        templateId: input.templateId,
        key: input.key,
        label: input.label,
        fieldType: input.fieldType,
        required: input.required,
        maxLength: input.maxLength ?? null,
        placeholder: input.placeholder ?? null,
        helpText: input.helpText ?? null,
        sortOrder: input.sortOrder,
      },
    });
    return toField(row);
  },
  async update(id, input) {
    const row = await db().templateField.update({
      where: { id },
      data: {
        ...(input.key !== undefined ? { key: input.key } : {}),
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.fieldType !== undefined ? { fieldType: input.fieldType } : {}),
        ...(input.required !== undefined ? { required: input.required } : {}),
        ...(input.maxLength !== undefined ? { maxLength: input.maxLength } : {}),
        ...(input.placeholder !== undefined ? { placeholder: input.placeholder } : {}),
        ...(input.helpText !== undefined ? { helpText: input.helpText } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return toField(row);
  },
  async delete(id) {
    await db().templateField.delete({ where: { id } });
  },
  async findById(id) {
    const row = await db().templateField.findUnique({ where: { id } });
    return row ? toField(row) : null;
  },
  async findByTemplate(templateId) {
    const rows = await db().templateField.findMany({
      where: { templateId },
      orderBy: { sortOrder: 'asc' },
    });
    return rows.map(toField);
  },
  async reorderFields(templateId, fieldIds) {
    await db().$transaction(
      fieldIds.map((fieldId, index) =>
        db().templateField.updateMany({
          where: { id: fieldId, templateId },
          data: { sortOrder: index },
        }),
      ),
    );
    return this.findByTemplate(templateId);
  },
};
