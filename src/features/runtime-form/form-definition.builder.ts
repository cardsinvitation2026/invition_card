import type { TemplateDetail } from '@/types/template';
import type { TemplateField } from '@/types/template-field';
import type {
  RuntimeFormDefinition,
  RuntimeFormDefinitionResponse,
} from '@/types/form-runtime';
import {
  buildValidationMetadata,
  groupFieldsIntoSections,
  sortRuntimeFields,
  templateFieldToRuntimeField,
} from './field-section.mapper';

export function buildFormDefinition(
  template: TemplateDetail,
  templateFields: TemplateField[],
): RuntimeFormDefinition {
  const runtimeFields = sortRuntimeFields(templateFields.map(templateFieldToRuntimeField));
  const sections = groupFieldsIntoSections(runtimeFields);

  return {
    templateId: template.id,
    templateSlug: template.slug,
    templateName: template.name,
    fields: runtimeFields,
    sections,
  };
}

export function buildFormDefinitionResponse(
  template: TemplateDetail,
  templateFields: TemplateField[],
): RuntimeFormDefinitionResponse {
  const definition = buildFormDefinition(template, templateFields);

  return {
    template,
    fields: definition.fields,
    sections: definition.sections,
    validation: buildValidationMetadata(definition.fields),
  };
}
