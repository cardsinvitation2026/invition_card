/**
 * Populate PostgreSQL with dev catalog data (categories, templates, fields, plans).
 * Usage: npm run db:seed
 */
import { resolve } from 'node:path';
import { loadEnvConfig } from '@next/env';
import { PrismaClient } from '@prisma/client';
import { seedCategories } from '../src/features/categories/inmemory-category.repository';
import { templateSeed } from '../src/features/templates/seed';
import { seedMembershipPlans } from '../src/features/membership-plans/seed';

loadEnvConfig(resolve(__dirname, '..'));

const STANDARD_VIDEO_FIELDS = [
  {
    key: 'GROOM_NAME',
    label: 'Groom Name',
    fieldType: 'text',
    required: true,
    maxLength: 100,
    placeholder: 'Enter groom name',
    sortOrder: 0,
  },
  {
    key: 'BRIDE_NAME',
    label: 'Bride Name',
    fieldType: 'text',
    required: true,
    maxLength: 100,
    placeholder: 'Enter bride name',
    sortOrder: 1,
  },
  {
    key: 'EVENT_DATE',
    label: 'Event Date',
    fieldType: 'date',
    required: true,
    maxLength: null,
    placeholder: null,
    sortOrder: 2,
  },
] as const;

function buildVideoTemplateFields() {
  const fields: Array<{
    id: string;
    templateId: string;
    key: string;
    label: string;
    fieldType: string;
    required: boolean;
    maxLength: number | null;
    placeholder: string | null;
    helpText: null;
    sortOrder: number;
  }> = [];

  for (const template of templateSeed.filter((t) => t.type === 'VIDEO')) {
    for (const spec of STANDARD_VIDEO_FIELDS) {
      const slugKey = template.slug.replace(/-/g, '_');
      const legacyId =
        template.id === 'tpl_royal_mandap_gold' && spec.key === 'GROOM_NAME'
          ? 'fld_groom_name'
          : template.id === 'tpl_royal_mandap_gold' && spec.key === 'BRIDE_NAME'
            ? 'fld_bride_name'
            : `fld_${slugKey}_${spec.key.toLowerCase()}`;

      fields.push({
        id: legacyId,
        templateId: template.id,
        key: spec.key,
        label: spec.label,
        fieldType: spec.fieldType,
        required: spec.required,
        maxLength: spec.maxLength,
        placeholder: spec.placeholder,
        helpText: null,
        sortOrder: spec.sortOrder,
      });
    }
  }

  return fields;
}

const seedTemplateFields = buildVideoTemplateFields();

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required. Add it to .env or .env.local');
    process.exit(1);
  }

  console.log('Seeding categories...');
  for (const c of seedCategories) {
    await prisma.category.upsert({
      where: { id: c.id },
      create: {
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        seoKeywords: c.seoKeywords,
        sortOrder: c.sortOrder,
        active: c.active,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      },
      update: {
        name: c.name,
        slug: c.slug,
        description: c.description,
        thumbnail: c.thumbnail,
        seoTitle: c.seoTitle,
        seoDescription: c.seoDescription,
        seoKeywords: c.seoKeywords,
        sortOrder: c.sortOrder,
        active: c.active,
        updatedAt: new Date(c.updatedAt),
      },
    });
  }

  console.log('Seeding templates...');
  for (const t of templateSeed) {
    await prisma.template.upsert({
      where: { id: t.id },
      create: {
        id: t.id,
        categoryId: t.categoryId,
        musicId: t.musicId,
        name: t.name,
        slug: t.slug,
        description: t.description,
        type: t.type,
        language: t.language,
        status: t.status,
        visibility: t.visibility,
        thumbnail: t.thumbnail,
        demoPreviewUrl: t.demoPreviewUrl,
        featured: t.featured,
        trending: t.trending,
        bestSeller: t.bestSeller,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        seoKeywords: t.seoKeywords,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
      },
      update: {
        categoryId: t.categoryId,
        musicId: t.musicId,
        name: t.name,
        slug: t.slug,
        description: t.description,
        type: t.type,
        language: t.language,
        status: t.status,
        visibility: t.visibility,
        thumbnail: t.thumbnail,
        demoPreviewUrl: t.demoPreviewUrl,
        featured: t.featured,
        trending: t.trending,
        bestSeller: t.bestSeller,
        seoTitle: t.seoTitle,
        seoDescription: t.seoDescription,
        seoKeywords: t.seoKeywords,
        updatedAt: new Date(t.updatedAt),
      },
    });
  }

  console.log('Seeding template fields...');
  for (const f of seedTemplateFields) {
    await prisma.templateField.upsert({
      where: { id: f.id },
      create: { ...f },
      update: {
        templateId: f.templateId,
        key: f.key,
        label: f.label,
        fieldType: f.fieldType,
        required: f.required,
        maxLength: f.maxLength,
        placeholder: f.placeholder,
        helpText: f.helpText,
        sortOrder: f.sortOrder,
      },
    });
  }

  console.log('Seeding membership plans...');
  for (const p of seedMembershipPlans) {
    await prisma.membershipPlan.upsert({
      where: { id: p.id },
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        validityDays: p.validityDays,
        downloadLimit: p.downloadLimit,
        active: p.active,
        sortOrder: p.sortOrder,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        currency: p.currency,
        validityDays: p.validityDays,
        downloadLimit: p.downloadLimit,
        active: p.active,
        sortOrder: p.sortOrder,
        updatedAt: new Date(p.updatedAt),
      },
    });
  }

  const [categories, templates, fields, plans] = await Promise.all([
    prisma.category.count(),
    prisma.template.count(),
    prisma.templateField.count(),
    prisma.membershipPlan.count(),
  ]);

  console.log('Seed complete:', { categories, templates, fields, plans });
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
