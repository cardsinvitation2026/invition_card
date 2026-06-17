import 'server-only';
import { randomUUID } from 'node:crypto';
import type { DraftRepository } from './draft.repository';
import type {
  DraftCreateData,
  DraftFieldValueRecord,
  DraftListItem,
  DraftUpdateData,
  DraftWithValues,
} from '@/types/draft';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_drafts__: Map<string, DraftWithValues> | undefined;
  // eslint-disable-next-line no-var
  var __mi_inmem_draft_field_values__: Map<string, DraftFieldValueRecord> | undefined;
  // eslint-disable-next-line no-var
  var __mi_inmem_draft_template_names__: Map<string, string> | undefined;
  // eslint-disable-next-line no-var
  var __mi_inmem_draft_template_slugs__: Map<string, string> | undefined;
}

function draftStore(): Map<string, DraftWithValues> {
  if (!globalThis.__mi_inmem_drafts__) {
    globalThis.__mi_inmem_drafts__ = new Map();
  }
  return globalThis.__mi_inmem_drafts__;
}

function fieldValueStore(): Map<string, DraftFieldValueRecord> {
  if (!globalThis.__mi_inmem_draft_field_values__) {
    globalThis.__mi_inmem_draft_field_values__ = new Map();
  }
  return globalThis.__mi_inmem_draft_field_values__;
}

function templateNameStore(): Map<string, string> {
  if (!globalThis.__mi_inmem_draft_template_names__) {
    globalThis.__mi_inmem_draft_template_names__ = new Map();
  }
  return globalThis.__mi_inmem_draft_template_names__;
}

function notDeleted(draft: DraftWithValues): boolean {
  return draft.status === 'ACTIVE';
}

function toListItem(draft: DraftWithValues): DraftListItem {
  return {
    id: draft.id,
    templateId: draft.templateId,
    templateName: templateNameStore().get(draft.templateId) ?? draft.title,
    templateSlug: templateSlugStore().get(draft.templateId) ?? '',
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

function templateSlugStore(): Map<string, string> {
  if (!globalThis.__mi_inmem_draft_template_slugs__) {
    globalThis.__mi_inmem_draft_template_slugs__ = new Map();
  }
  return globalThis.__mi_inmem_draft_template_slugs__;
}

export function setInMemoryDraftTemplateMeta(
  templateId: string,
  name: string,
  slug: string,
): void {
  templateNameStore().set(templateId, name);
  templateSlugStore().set(templateId, slug);
}

export const inMemoryDraftRepository: DraftRepository = {
  async create(input: DraftCreateData) {
    const now = new Date().toISOString();
    const draftId = randomUUID();
    const fieldValues: DraftFieldValueRecord[] = input.values.map((v) => {
      const row: DraftFieldValueRecord = {
        id: randomUUID(),
        draftId,
        fieldId: v.fieldId,
        value: v.value,
        createdAt: now,
        updatedAt: now,
      };
      fieldValueStore().set(row.id, row);
      return row;
    });

    const created: DraftWithValues = {
      id: draftId,
      userId: input.userId,
      templateId: input.templateId,
      title: input.title,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      fieldValues,
    };

    draftStore().set(draftId, created);
    return created;
  },

  async update(id, userId, input: DraftUpdateData) {
    const existing = draftStore().get(id);
    if (!existing || existing.userId !== userId || !notDeleted(existing)) {
      throw new Error('Draft not found');
    }

    const now = new Date().toISOString();
    const fieldValues: DraftFieldValueRecord[] = input.values.map((v) => {
      const prev = existing.fieldValues.find((fv) => fv.fieldId === v.fieldId);
      const row: DraftFieldValueRecord = {
        id: prev?.id ?? randomUUID(),
        draftId: id,
        fieldId: v.fieldId,
        value: v.value,
        createdAt: prev?.createdAt ?? now,
        updatedAt: now,
      };
      fieldValueStore().set(row.id, row);
      return row;
    });

    const updated: DraftWithValues = {
      ...existing,
      ...(input.title !== undefined ? { title: input.title } : {}),
      updatedAt: now,
      fieldValues,
    };

    draftStore().set(id, updated);
    return updated;
  },

  async delete(id, userId) {
    const existing = draftStore().get(id);
    if (!existing || existing.userId !== userId || !notDeleted(existing)) {
      throw new Error('Draft not found');
    }
    draftStore().set(id, {
      ...existing,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    });
  },

  async findById(id, userId) {
    const draft = draftStore().get(id);
    if (!draft || draft.userId !== userId || !notDeleted(draft)) {
      return null;
    }
    return draft;
  },

  async findByUserAndTemplate(userId, templateId) {
    const matches = [...draftStore().values()]
      .filter((d) => d.userId === userId && d.templateId === templateId && notDeleted(d))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return matches[0] ?? null;
  },

  async listByUser(userId, query) {
    let list = [...draftStore().values()].filter((d) => d.userId === userId && notDeleted(d));

    if (query.templateId) {
      list = list.filter((d) => d.templateId === query.templateId);
    }

    if (query.search?.trim()) {
      const q = query.search.trim().toLowerCase();
      list = list.filter((d) => {
        const name = templateNameStore().get(d.templateId) ?? d.title;
        return name.toLowerCase().includes(q) || d.title.toLowerCase().includes(q);
      });
    }

    list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const total = list.length;
    const skip = (query.page - 1) * query.pageSize;
    const pageItems = list.slice(skip, skip + query.pageSize).map(toListItem);

    return {
      items: pageItems,
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async countByUser(userId) {
    return [...draftStore().values()].filter((d) => d.userId === userId && notDeleted(d)).length;
  },
};
