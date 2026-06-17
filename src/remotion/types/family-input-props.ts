import type { TemplateDetail } from '@/types/template';
import type { RuntimeFormValues } from '@/types/form-runtime';

export interface FamilyInputProps {
  template: TemplateDetail;
  values: RuntimeFormValues;
  musicUrl: string | null | undefined;
}
