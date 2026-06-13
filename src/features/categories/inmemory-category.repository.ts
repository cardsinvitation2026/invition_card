import 'server-only';
import type { Category, CategoryWithCount } from '@/types/category';
import type { CategoryRepository } from './category.repository';
import { templateSeed } from '@/features/templates/seed';

const now = new Date().toISOString();

export const seedCategories: Category[] = [
  {
    id: 'cat_wedding',
    name: 'Wedding',
    slug: 'wedding',
    description: 'Animated wedding invitations — from classic mandap to modern minimalism.',
    thumbnail:
      'https://images.unsplash.com/photo-1597157639073-69284dc0fdaf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjB3ZWRkaW5nJTIwY2VsZWJyYXRpb258ZW58MHx8fHwxNzgxMzU5ODMwfDA&ixlib=rb-4.1.0&q=85',
    seoTitle: 'Wedding Invitation Templates',
    seoDescription: 'Browse beautifully animated wedding invitation templates for video and PDF formats.',
    seoKeywords: 'wedding invitation, video invitation, save the date',
    sortOrder: 1,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat_engagement',
    name: 'Engagement',
    slug: 'engagement',
    description: 'Romantic, modern engagement invitations — ring ceremonies and roka.',
    thumbnail:
      'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwzfHxlbmdhZ2VtZW50JTIwcmluZ3xlbnwwfHx8fDE3ODEzNTk4MzB8MA&ixlib=rb-4.1.0&q=85',
    seoTitle: 'Engagement Invitation Templates',
    seoDescription: 'Browse animated engagement and ring ceremony invitation templates.',
    seoKeywords: 'engagement invitation, ring ceremony, roka invitation',
    sortOrder: 2,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat_birthday',
    name: 'Birthday',
    slug: 'birthday',
    description: 'From first birthday to sweet sixteen — joyful animated invites.',
    thumbnail:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxiaXJ0aGRheSUyMGNlbGVicmF0aW9ufGVufDB8fHx8MTc4MTM1OTgzMHww&ixlib=rb-4.1.0&q=85',
    seoTitle: 'Birthday Invitation Templates',
    seoDescription: 'Personalised birthday invitation templates for kids, teens and adults.',
    seoKeywords: 'birthday invitation, first birthday, kids party',
    sortOrder: 3,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat_anniversary',
    name: 'Anniversary',
    slug: 'anniversary',
    description: 'Mark milestones beautifully — 5th, 25th, 50th anniversary invites.',
    thumbnail:
      'https://images.unsplash.com/photo-1489094889106-39069373d6ef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwzfHxhbm5pdmVyc2FyeSUyMGNvdXBsZXxlbnwwfHx8fDE3ODEzNTk4MzZ8MA&ixlib=rb-4.1.0&q=85',
    seoTitle: 'Anniversary Invitation Templates',
    seoDescription: 'Anniversary invitation templates for silver, golden and milestone celebrations.',
    seoKeywords: 'anniversary invitation, silver jubilee, golden jubilee',
    sortOrder: 4,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'cat_house_warming',
    name: 'House Warming',
    slug: 'house-warming',
    description: 'Griha Pravesh and house-warming invitations — warm, welcoming, sacred.',
    thumbnail:
      'https://images.pexels.com/photos/34431714/pexels-photo-34431714.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    seoTitle: 'House Warming Invitation Templates',
    seoDescription: 'Griha Pravesh, housewarming and new-home invitation templates.',
    seoKeywords: 'house warming invitation, griha pravesh',
    sortOrder: 5,
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];

function countForCategory(categoryId: string): number {
  return templateSeed.filter((t) => t.categoryId === categoryId).length;
}

export const inMemoryCategoryRepository: CategoryRepository = {
  async list(opts) {
    const list = opts?.activeOnly ? seedCategories.filter((c) => c.active) : seedCategories.slice();
    return list
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c): CategoryWithCount => ({ ...c, templateCount: countForCategory(c.id) }));
  },
  async findBySlug(slug) {
    return seedCategories.find((c) => c.slug === slug) ?? null;
  },
  async findById(id) {
    return seedCategories.find((c) => c.id === id) ?? null;
  },
};
