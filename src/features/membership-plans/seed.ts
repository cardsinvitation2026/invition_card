import 'server-only';
import type { MembershipPlan, MembershipPlanListItem } from '@/types/membership-plan';

const NOW = '2026-06-01T00:00:00.000Z';

export const seedMembershipPlans: MembershipPlan[] = [
  {
    id: 'plan_basic',
    name: 'Basic',
    description: 'Starter plan with limited downloads.',
    price: 9900,
    currency: 'INR',
    validityDays: 30,
    downloadLimit: 5,
    active: true,
    sortOrder: 1,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  },
  {
    id: 'plan_premium',
    name: 'Premium',
    description: 'Popular plan with more downloads.',
    price: 17900,
    currency: 'INR',
    validityDays: 60,
    downloadLimit: 15,
    active: true,
    sortOrder: 2,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  },
  {
    id: 'plan_elite',
    name: 'Elite',
    description: 'Unlimited downloads for power users.',
    price: 23900,
    currency: 'INR',
    validityDays: 90,
    downloadLimit: null,
    active: true,
    sortOrder: 3,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
  },
];

export function toMembershipPlanListItem(plan: MembershipPlan): MembershipPlanListItem {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    price: plan.price,
    currency: plan.currency,
    validityDays: plan.validityDays,
    downloadLimit: plan.downloadLimit,
    active: plan.active,
    sortOrder: plan.sortOrder,
  };
}
