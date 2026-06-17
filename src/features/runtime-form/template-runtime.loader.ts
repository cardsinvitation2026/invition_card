import 'server-only';
import { templateService } from '@/features/templates';
import { templateFieldService } from '@/features/template-fields';
import { templateSlugSchema } from '@/validations/template';
import type { TemplateDetail } from '@/types/template';
import type { TemplateField } from '@/types/template-field';

export type TemplateRuntimeLoadResult =
  | { ok: true; template: TemplateDetail; fields: TemplateField[] }
  | { ok: false; status: 400 | 404; message: string };

export async function loadTemplateRuntimeBySlug(slug: string): Promise<TemplateRuntimeLoadResult> {
  const parsed = templateSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return { ok: false, status: 400, message: 'Invalid slug' };
  }

  const template = await templateService.getBySlug(parsed.data);
  if (!template) {
    return { ok: false, status: 404, message: 'Template not found' };
  }

  const fields = await templateFieldService.findByTemplate(template.id);
  const items = [...fields].sort((a, b) => a.sortOrder - b.sortOrder);

  return { ok: true, template, fields: items };
}
