// Stage 1: Template type placeholders.
export type InvitationOccasion =
  | 'wedding'
  | 'engagement'
  | 'birthday'
  | 'anniversary'
  | 'house_warming';

export type InvitationFormat = 'video' | 'pdf_single' | 'pdf_multi';

export interface InvitationTemplate {
  id: string;
  slug: string;
  title: string;
  occasion: InvitationOccasion;
  format: InvitationFormat;
}
