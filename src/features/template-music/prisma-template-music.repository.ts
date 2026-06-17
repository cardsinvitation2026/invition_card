import 'server-only';
import type { TemplateMusicRepository } from './template-music.repository';
import type { TemplateMusic } from '@/types/template-music';
import { getPrisma } from '@/lib/prisma/client';

function db() {
  const p = getPrisma();
  if (!p) throw new Error('Prisma unavailable');
  return p;
}

function toMusic(row: {
  id: string;
  name: string;
  url: string;
  artist: string | null;
  durationSec: number | null;
  license: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TemplateMusic {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    artist: row.artist,
    durationSec: row.durationSec,
    license: row.license,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const prismaTemplateMusicRepository: TemplateMusicRepository = {
  async create(input) {
    const row = await db().templateMusic.create({
      data: {
        name: input.name,
        url: input.url,
        artist: input.artist ?? null,
        durationSec: input.durationSec ?? null,
        license: input.license ?? null,
        active: input.active,
      },
    });
    return toMusic(row);
  },
  async update(id, input) {
    const row = await db().templateMusic.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.artist !== undefined ? { artist: input.artist } : {}),
        ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
        ...(input.license !== undefined ? { license: input.license } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
      },
    });
    return toMusic(row);
  },
  async delete(id) {
    await db().templateMusic.delete({ where: { id } });
  },
  async findById(id) {
    const row = await db().templateMusic.findUnique({ where: { id } });
    return row ? toMusic(row) : null;
  },
  async findDefault() {
    const row = await db().templateMusic.findFirst({
      where: { active: true },
      orderBy: [{ createdAt: 'asc' }],
    });
    return row ? toMusic(row) : null;
  },
  async list() {
    const rows = await db().templateMusic.findMany({
      orderBy: [{ name: 'asc' }],
    });
    return rows.map(toMusic);
  },
  async count() {
    return db().templateMusic.count();
  },
};
