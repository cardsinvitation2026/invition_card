import 'server-only';
import type { DraftRepository } from './draft.repository';
import type {
  DraftCreateData,
  DraftFieldValueRecord,
  DraftListQuery,
  DraftUpdateData,
  DraftWithValues,
} from '@/types/draft';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function notDeleted() {
  return { deletedAt: null, status: 'ACTIVE' };
}

function toDraft(row: {
  id: string;
  userId: string;
  templateId: string;
  title: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): DraftWithValues {
  return {
    id: row.id,
    userId: row.userId,
    templateId: row.templateId,
    title: row.title,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    fieldValues: [],
  };
}

function toFieldValue(row: {
  id: string;
  draftId: string;
  fieldId: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}): DraftFieldValueRecord {
  return {
    id: row.id,
    draftId: row.draftId,
    fieldId: row.fieldId,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const prismaDraftRepository: DraftRepository = {
  async create(input: DraftCreateData) {
    const row = await db().draft.create({
      data: {
        userId: input.userId,
        templateId: input.templateId,
        title: input.title,
        status: 'ACTIVE',
        fieldValues: {
          create: input.values.map((v) => ({
            fieldId: v.fieldId,
            value: v.value,
          })),
        },
      },
      include: {
        fieldValues: true,
      },
    });

    const draft = toDraft(row);
    draft.fieldValues = row.fieldValues.map(toFieldValue);
    return draft;
  },

  async update(id, userId, input: DraftUpdateData) {
    const existing = await db().draft.findFirst({
      where: { id, userId, ...notDeleted() },
    });
    if (!existing) {
      throw new Error('Draft not found');
    }

    await db().$transaction(
      input.values.map((v) =>
        db().draftFieldValue.upsert({
          where: {
            draftId_fieldId: {
              draftId: id,
              fieldId: v.fieldId,
            },
          },
          create: {
            draftId: id,
            fieldId: v.fieldId,
            value: v.value,
          },
          update: {
            value: v.value,
          },
        }),
      ),
    );

    const row = await db().draft.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title } : {}),
        updatedAt: new Date(),
      },
      include: { fieldValues: true },
    });

    const draft = toDraft(row);
    draft.fieldValues = row.fieldValues.map(toFieldValue);
    return draft;
  },

  async delete(id, userId) {
    const existing = await db().draft.findFirst({
      where: { id, userId, ...notDeleted() },
    });
    if (!existing) {
      throw new Error('Draft not found');
    }

    await db().draft.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    });
  },

  async findById(id, userId) {
    const row = await db().draft.findFirst({
      where: { id, userId, ...notDeleted() },
      include: { fieldValues: true },
    });
    if (!row) return null;
    const draft = toDraft(row);
    draft.fieldValues = row.fieldValues.map(toFieldValue);
    return draft;
  },

  async findByUserAndTemplate(userId, templateId) {
    const row = await db().draft.findFirst({
      where: { userId, templateId, ...notDeleted() },
      orderBy: { updatedAt: 'desc' },
      include: { fieldValues: true },
    });
    if (!row) return null;
    const draft = toDraft(row);
    draft.fieldValues = row.fieldValues.map(toFieldValue);
    return draft;
  },

  async listByUser(userId, query: DraftListQuery) {
    const where = {
      userId,
      ...notDeleted(),
      ...(query.templateId ? { templateId: query.templateId } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' as const } },
              {
                template: {
                  name: { contains: query.search.trim(), mode: 'insensitive' as const },
                },
              },
            ],
          }
        : {}),
    };

    const skip = (query.page - 1) * query.pageSize;
    const [rows, total] = await Promise.all([
      db().draft.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { updatedAt: 'desc' },
        include: {
          template: { select: { name: true, slug: true } },
        },
      }),
      db().draft.count({ where }),
    ]);

    return {
      items: rows.map((row) => ({
        id: row.id,
        templateId: row.templateId,
        templateName: row.template.name,
        templateSlug: row.template.slug,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      })),
      total,
      page: query.page,
      pageSize: query.pageSize,
      pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
    };
  },

  async countByUser(userId) {
    return db().draft.count({
      where: { userId, ...notDeleted() },
    });
  },
};
