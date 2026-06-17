import 'server-only';
import type { DraftRepository } from './draft.repository';
import { prismaDraftRepository } from './prisma-draft.repository';
import {
  inMemoryDraftRepository,
  setInMemoryDraftTemplateMeta,
} from './inmemory-draft.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import { templateService } from '@/features/templates';
import { templateFieldService } from '@/features/template-fields';
import {
  draftFieldValuesToRuntimeValues,
  runtimeValuesToDraftFieldValues,
} from './draft-values.mapper';
import type { DraftCreateInput, DraftListQueryInput, DraftUpdateInput } from '@/validations/draft.validation';
import { MAX_DRAFTS_PER_USER } from '@/validations/draft.validation';
import type {
  DraftDetailResponse,
  DraftListQuery,
  DraftListResult,
} from '@/types/draft';
import type { RuntimeFormValues } from '@/types/form-runtime';

function repo(): DraftRepository {
  return hasDatabaseUrl() ? prismaDraftRepository : inMemoryDraftRepository;
}

function toListQuery(input: DraftListQueryInput): DraftListQuery {
  return {
    page: input.page,
    pageSize: input.pageSize,
    search: input.search,
    templateId: input.templateId,
  };
}

function toDetailResponse(
  draft: Awaited<ReturnType<DraftRepository['findById']>>,
  fields: Awaited<ReturnType<typeof templateFieldService.findByTemplate>>,
): DraftDetailResponse {
  if (!draft) {
    throw new Error('Draft not found');
  }
  const { fieldValues, ...detail } = draft;
  return {
    draft: detail,
    fieldValues,
    values: draftFieldValuesToRuntimeValues(fieldValues, fields),
  };
}

export const draftService = {
  async createDraft(userId: string, input: DraftCreateInput): Promise<DraftDetailResponse> {
    const count = await repo().countByUser(userId);
    if (count >= MAX_DRAFTS_PER_USER) {
      throw new Error('DRAFT_LIMIT_REACHED');
    }

    const template = await templateService.getTemplate(input.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const fields = await templateFieldService.findByTemplate(input.templateId);
    const valueRows = runtimeValuesToDraftFieldValues(input.values, fields);

    if (!hasDatabaseUrl()) {
      setInMemoryDraftTemplateMeta(template.id, template.name, template.slug);
    }

    const created = await repo().create({
      userId,
      templateId: input.templateId,
      title: template.name,
      values: valueRows,
    });

    return toDetailResponse(created, fields);
  },

  async updateDraft(
    userId: string,
    draftId: string,
    input: DraftUpdateInput,
  ): Promise<DraftDetailResponse> {
    const existing = await repo().findById(draftId, userId);
    if (!existing) {
      throw new Error('Draft not found');
    }

    const fields = await templateFieldService.findByTemplate(existing.templateId);
    const valueRows = runtimeValuesToDraftFieldValues(input.values, fields);

    const updated = await repo().update(draftId, userId, {
      values: valueRows,
    });

    return toDetailResponse(updated, fields);
  },

  async deleteDraft(userId: string, draftId: string): Promise<void> {
    const existing = await repo().findById(draftId, userId);
    if (!existing) {
      throw new Error('Draft not found');
    }
    await repo().delete(draftId, userId);
  },

  async getDraft(userId: string, draftId: string): Promise<DraftDetailResponse | null> {
    const draft = await repo().findById(draftId, userId);
    if (!draft) {
      return null;
    }
    const fields = await templateFieldService.findByTemplate(draft.templateId);
    return toDetailResponse(draft, fields);
  },

  async getDraftForTemplate(
    userId: string,
    templateId: string,
  ): Promise<DraftDetailResponse | null> {
    const draft = await repo().findByUserAndTemplate(userId, templateId);
    if (!draft) {
      return null;
    }
    const fields = await templateFieldService.findByTemplate(templateId);
    return toDetailResponse(draft, fields);
  },

  async listDrafts(userId: string, input: DraftListQueryInput): Promise<DraftListResult> {
    return repo().listByUser(userId, toListQuery(input));
  },

  async countDrafts(userId: string): Promise<number> {
    return repo().countByUser(userId);
  },

  async restoreValues(
    userId: string,
    templateId: string,
  ): Promise<{ draftId: string; values: RuntimeFormValues } | null> {
    const restored = await this.getDraftForTemplate(userId, templateId);
    if (!restored) {
      return null;
    }
    return {
      draftId: restored.draft.id,
      values: restored.values,
    };
  },
};

export { MAX_DRAFTS_PER_USER };
