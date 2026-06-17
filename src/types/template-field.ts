export interface TemplateField {
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
  createdAt: string;
  updatedAt: string;
}

export interface TemplateFieldCreateData {
  templateId: string;
  key: string;
  label: string;
  fieldType: string;
  required: boolean;
  placeholder?: string | null;
  sortOrder: number;
  maxLength?: number | null;
  helpText?: string | null;
}

export interface TemplateFieldUpdateData {
  key?: string;
  label?: string;
  fieldType?: string;
  required?: boolean;
  placeholder?: string | null;
  sortOrder?: number;
  maxLength?: number | null;
  helpText?: string | null;
}
