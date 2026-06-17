import 'server-only';
import type { TemplateFieldRepository } from './template-field.repository';
import { prismaTemplateFieldRepository } from './prisma-template-field.repository';
import { inMemoryTemplateFieldRepository } from './inmemory-template-field.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type {
  CreateFieldInput,
  ReorderFieldsInput,
  UpdateFieldInput,
} from '@/validations/template-field.validation';
import type { TemplateFieldCreateData, TemplateFieldUpdateData } from '@/types/template-field';

function repo(): TemplateFieldRepository {
  return hasDatabaseUrl() ? prismaTemplateFieldRepository : inMemoryTemplateFieldRepository;
}

function serializeValidationRules(
  rules: CreateFieldInput['validationRules'],
): { maxLength: number | null; helpText: string | null } {
  if (!rules) {
    return { maxLength: null, helpText: null };
  }
  const { maxLength, ...rest } = rules;
  const hasExtra = Object.keys(rest).length > 0;
  return {
    maxLength: typeof maxLength === 'number' ? maxLength : null,
    helpText: hasExtra ? JSON.stringify(rest) : null,
  };
}

function toCreateData(input: CreateFieldInput): TemplateFieldCreateData {
  const rules = serializeValidationRules(input.validationRules);
  return {
    templateId: input.templateId,
    key: input.fieldKey,
    label: input.fieldLabel,
    fieldType: input.fieldType,
    required: input.required,
    placeholder: input.placeholder,
    sortOrder: input.sortOrder,
    maxLength: rules.maxLength,
    helpText: rules.helpText,
  };
}

function toUpdateData(input: UpdateFieldInput): TemplateFieldUpdateData {
  const data: TemplateFieldUpdateData = {};
  if (input.fieldKey !== undefined) data.key = input.fieldKey;
  if (input.fieldLabel !== undefined) data.label = input.fieldLabel;
  if (input.fieldType !== undefined) data.fieldType = input.fieldType;
  if (input.required !== undefined) data.required = input.required;
  if (input.placeholder !== undefined) data.placeholder = input.placeholder;
  if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;
  if (input.validationRules !== undefined) {
    const rules = serializeValidationRules(input.validationRules);
    data.maxLength = rules.maxLength;
    data.helpText = rules.helpText;
  }
  return data;
}

export const templateFieldService = {
  async createField(input: CreateFieldInput) {
    return repo().create(toCreateData(input));
  },
  async updateField(id: string, input: UpdateFieldInput) {
    return repo().update(id, toUpdateData(input));
  },
  async deleteField(id: string) {
    return repo().delete(id);
  },
  async findById(id: string) {
    return repo().findById(id);
  },
  async findByTemplate(templateId: string) {
    return repo().findByTemplate(templateId);
  },
  async reorderFields(input: ReorderFieldsInput) {
    return repo().reorderFields(input.templateId, input.fieldIds);
  },
};
