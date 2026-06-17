export {
  templateTypeSchema,
  languageCodeSchema,
  templateStatusSchema,
  templateVisibilitySchema,
  templatePublicSortSchema,
  templateAdminSortSchema,
  TemplateCreateSchema,
  TemplateUpdateSchema,
  templateSlugSchema,
  templateIdSchema,
  templatePublicListQuerySchema,
  templateAdminListQuerySchema,
  type TemplateCreateInput,
  type TemplateUpdateInput,
  type TemplatePublicListQueryInput,
  type TemplateAdminListQueryInput,
} from './template.validation';

// Stage 4 backward-compatible aliases
export { templatePublicListQuerySchema as templateListQuerySchema } from './template.validation';
export type { TemplatePublicListQueryInput as TemplateListQueryInput } from './template.validation';
export { templatePublicSortSchema as templateSortSchema } from './template.validation';
