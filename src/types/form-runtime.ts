import type { TemplateDetail } from '@/types/template';

export type RuntimeFieldType =
  | 'text'
  | 'textarea'
  | 'date'
  | 'number'
  | 'image'
  | 'email'
  | 'phone'
  | 'url';

export interface RuntimeFieldValidation {
  required: boolean;
  maxLength: number | null;
  minLength: number | null;
  pattern: string | null;
}

export interface RuntimeField {
  id: string;
  key: string;
  label: string;
  fieldType: RuntimeFieldType;
  required: boolean;
  maxLength: number | null;
  placeholder: string | null;
  helpText: string | null;
  sortOrder: number;
  sectionKey: string;
  validation: RuntimeFieldValidation;
}

export interface RuntimeSection {
  key: string;
  label: string;
  order: number;
  fields: RuntimeField[];
}

export interface RuntimeFormDefinition {
  templateId: string;
  templateSlug: string;
  templateName: string;
  fields: RuntimeField[];
  sections: RuntimeSection[];
}

export interface RuntimeFormDefinitionResponse {
  template: TemplateDetail;
  fields: RuntimeField[];
  sections: RuntimeSection[];
  validation: Record<string, RuntimeFieldValidation>;
}

export type RuntimeFormValues = Record<string, string | number | null | undefined>;

export type PreviewDataObject = Record<string, string | number>;
