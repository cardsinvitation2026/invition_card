export interface TemplateMusic {
  id: string;
  name: string;
  url: string;
  artist: string | null;
  durationSec: number | null;
  license: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateMusicCreateData {
  name: string;
  url: string;
  artist?: string | null;
  durationSec?: number | null;
  license?: string | null;
  active: boolean;
  isDefault?: boolean;
}

export interface TemplateMusicUpdateData {
  name?: string;
  url?: string;
  artist?: string | null;
  durationSec?: number | null;
  license?: string | null;
  active?: boolean;
  isDefault?: boolean;
}
