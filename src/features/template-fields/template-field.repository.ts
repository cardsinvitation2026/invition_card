import type {
  TemplateField,
  TemplateFieldCreateData,
  TemplateFieldUpdateData,
} from '@/types/template-field';

export interface TemplateFieldRepository {
  create(input: TemplateFieldCreateData): Promise<TemplateField>;
  update(id: string, input: TemplateFieldUpdateData): Promise<TemplateField>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<TemplateField | null>;
  findByTemplate(templateId: string): Promise<TemplateField[]>;
  reorderFields(templateId: string, fieldIds: string[]): Promise<TemplateField[]>;
}
