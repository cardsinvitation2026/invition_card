// Stage 1: Draft type placeholder.
export interface InvitationDraft {
  id: string;
  userId: string;
  templateId: string;
  data: Record<string, unknown>;
  updatedAt: string;
}
