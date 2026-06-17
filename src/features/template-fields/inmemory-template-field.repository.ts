import 'server-only';
import { randomUUID } from 'node:crypto';
import type { TemplateFieldRepository } from './template-field.repository';
import type { TemplateField, TemplateFieldCreateData, TemplateFieldUpdateData } from '@/types/template-field';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_fields__: Map<string, TemplateField> | undefined;
}

const seedFields: TemplateField[] = [
  {
    id: 'fld_bride_name',
    templateId: 'tpl_royal_mandap_gold',
    key: 'BRIDE_NAME',
    label: 'Bride Name',
    fieldType: 'text',
    required: true,
    maxLength: 100,
    placeholder: 'Enter bride name',
    helpText: null,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fld_groom_name',
    templateId: 'tpl_royal_mandap_gold',
    key: 'GROOM_NAME',
    label: 'Groom Name',
    fieldType: 'text',
    required: true,
    maxLength: 100,
    placeholder: 'Enter groom name',
    helpText: null,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function store(): Map<string, TemplateField> {
  if (!globalThis.__mi_inmem_fields__) {
    const map = new Map<string, TemplateField>();
    for (const f of seedFields) {
      map.set(f.id, { ...f });
    }
    globalThis.__mi_inmem_fields__ = map;
  }
  return globalThis.__mi_inmem_fields__;
}

export const inMemoryTemplateFieldRepository: TemplateFieldRepository = {
  async create(input: TemplateFieldCreateData) {
    const now = new Date().toISOString();
    const created: TemplateField = {
      id: randomUUID(),
      templateId: input.templateId,
      key: input.key,
      label: input.label,
      fieldType: input.fieldType,
      required: input.required,
      maxLength: input.maxLength ?? null,
      placeholder: input.placeholder ?? null,
      helpText: input.helpText ?? null,
      sortOrder: input.sortOrder,
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    return created;
  },
  async update(id, input: TemplateFieldUpdateData) {
    const existing = store().get(id);
    if (!existing) throw new Error('Template field not found');
    const updated: TemplateField = {
      ...existing,
      ...(input.key !== undefined ? { key: input.key } : {}),
      ...(input.label !== undefined ? { label: input.label } : {}),
      ...(input.fieldType !== undefined ? { fieldType: input.fieldType } : {}),
      ...(input.required !== undefined ? { required: input.required } : {}),
      ...(input.maxLength !== undefined ? { maxLength: input.maxLength } : {}),
      ...(input.placeholder !== undefined ? { placeholder: input.placeholder } : {}),
      ...(input.helpText !== undefined ? { helpText: input.helpText } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      updatedAt: new Date().toISOString(),
    };
    store().set(id, updated);
    return updated;
  },
  async delete(id) {
    if (!store().has(id)) throw new Error('Template field not found');
    store().delete(id);
  },
  async findById(id) {
    return store().get(id) ?? null;
  },
  async findByTemplate(templateId) {
    return [...store().values()]
      .filter((f) => f.templateId === templateId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async reorderFields(templateId, fieldIds) {
    fieldIds.forEach((fieldId, index) => {
      const field = store().get(fieldId);
      if (field && field.templateId === templateId) {
        store().set(fieldId, {
          ...field,
          sortOrder: index,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    return this.findByTemplate(templateId);
  },
};
