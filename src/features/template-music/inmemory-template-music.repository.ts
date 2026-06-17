import 'server-only';
import { randomUUID } from 'node:crypto';
import type { TemplateMusicRepository } from './template-music.repository';
import type { TemplateMusic, TemplateMusicCreateData, TemplateMusicUpdateData } from '@/types/template-music';

declare global {
  // eslint-disable-next-line no-var
  var __mi_inmem_music__: Map<string, TemplateMusic> | undefined;
  // eslint-disable-next-line no-var
  var __mi_inmem_default_music_id__: string | undefined;
}

const seedMusic: TemplateMusic[] = [
  {
    id: 'music_sehnai',
    name: 'Traditional Sehnai',
    url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    artist: 'Royal Ensemble',
    durationSec: 180,
    license: 'Royalty-free',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function store(): Map<string, TemplateMusic> {
  if (!globalThis.__mi_inmem_music__) {
    const map = new Map<string, TemplateMusic>();
    for (const m of seedMusic) {
      map.set(m.id, { ...m });
    }
    globalThis.__mi_inmem_music__ = map;
    globalThis.__mi_inmem_default_music_id__ = 'music_sehnai';
  }
  return globalThis.__mi_inmem_music__;
}

export const inMemoryTemplateMusicRepository: TemplateMusicRepository = {
  async create(input: TemplateMusicCreateData) {
    const now = new Date().toISOString();
    const created: TemplateMusic = {
      id: randomUUID(),
      name: input.name,
      url: input.url,
      artist: input.artist ?? null,
      durationSec: input.durationSec ?? null,
      license: input.license ?? null,
      active: input.active,
      createdAt: now,
      updatedAt: now,
    };
    store().set(created.id, created);
    if (input.isDefault) {
      globalThis.__mi_inmem_default_music_id__ = created.id;
    }
    return created;
  },
  async update(id, input: TemplateMusicUpdateData) {
    const existing = store().get(id);
    if (!existing) throw new Error('Template music not found');
    const updated: TemplateMusic = {
      ...existing,
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.artist !== undefined ? { artist: input.artist } : {}),
      ...(input.durationSec !== undefined ? { durationSec: input.durationSec } : {}),
      ...(input.license !== undefined ? { license: input.license } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      updatedAt: new Date().toISOString(),
    };
    store().set(id, updated);
    if (input.isDefault) {
      globalThis.__mi_inmem_default_music_id__ = id;
    }
    return updated;
  },
  async delete(id) {
    if (!store().has(id)) throw new Error('Template music not found');
    store().delete(id);
    if (globalThis.__mi_inmem_default_music_id__ === id) {
      globalThis.__mi_inmem_default_music_id__ = undefined;
    }
  },
  async findById(id) {
    return store().get(id) ?? null;
  },
  async findDefault() {
    const defaultId = globalThis.__mi_inmem_default_music_id__;
    if (defaultId) {
      const found = store().get(defaultId);
      if (found?.active) return found;
    }
    return [...store().values()].find((m) => m.active) ?? null;
  },
  async list() {
    return [...store().values()].sort((a, b) => a.name.localeCompare(b.name));
  },
  async count() {
    return store().size;
  },
};
