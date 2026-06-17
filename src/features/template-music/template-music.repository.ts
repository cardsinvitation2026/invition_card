import type {
  TemplateMusic,
  TemplateMusicCreateData,
  TemplateMusicUpdateData,
} from '@/types/template-music';

export interface TemplateMusicRepository {
  create(input: TemplateMusicCreateData): Promise<TemplateMusic>;
  update(id: string, input: TemplateMusicUpdateData): Promise<TemplateMusic>;
  delete(id: string): Promise<void>;
  findById(id: string): Promise<TemplateMusic | null>;
  findDefault(): Promise<TemplateMusic | null>;
  list(): Promise<TemplateMusic[]>;
  count(): Promise<number>;
}
