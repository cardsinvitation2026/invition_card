import 'server-only';
import type { TemplateMusicRepository } from './template-music.repository';
import { prismaTemplateMusicRepository } from './prisma-template-music.repository';
import { inMemoryTemplateMusicRepository } from './inmemory-template-music.repository';
import { hasDatabaseUrl } from '@/lib/auth/dev-mode';
import type { CreateMusicInput, UpdateMusicInput } from '@/validations/template-music.validation';
import type { TemplateMusicCreateData, TemplateMusicUpdateData } from '@/types/template-music';

function repo(): TemplateMusicRepository {
  return hasDatabaseUrl() ? prismaTemplateMusicRepository : inMemoryTemplateMusicRepository;
}

function toCreateData(input: CreateMusicInput): TemplateMusicCreateData {
  return {
    name: input.title,
    url: input.audioUrl,
    durationSec: input.durationSeconds ?? null,
    artist: input.artist ?? null,
    license: input.license ?? null,
    active: input.active,
    isDefault: input.isDefault,
  };
}

function toUpdateData(input: UpdateMusicInput): TemplateMusicUpdateData {
  const data: TemplateMusicUpdateData = {};
  if (input.title !== undefined) data.name = input.title;
  if (input.audioUrl !== undefined) data.url = input.audioUrl;
  if (input.durationSeconds !== undefined) data.durationSec = input.durationSeconds;
  if (input.artist !== undefined) data.artist = input.artist;
  if (input.license !== undefined) data.license = input.license;
  if (input.active !== undefined) data.active = input.active;
  if (input.isDefault !== undefined) data.isDefault = input.isDefault;
  return data;
}

export const templateMusicService = {
  async createMusic(input: CreateMusicInput) {
    return repo().create(toCreateData(input));
  },
  async updateMusic(id: string, input: UpdateMusicInput) {
    return repo().update(id, toUpdateData(input));
  },
  async deleteMusic(id: string) {
    return repo().delete(id);
  },
  async findById(id: string) {
    return repo().findById(id);
  },
  async findDefault() {
    return repo().findDefault();
  },
  async list() {
    return repo().list();
  },
  async count() {
    return repo().count();
  },
};
