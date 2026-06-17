/**
 * Stage 12A verification (in-memory mode).
 * Usage: npm run membership:verify
 */
import { membershipPlanService } from '../src/features/membership-plans';
import { membershipService } from '../src/features/memberships';
import { userService } from '../src/features/users';

const TEST_USER = {
  firebaseUid: 'verify-membership-user',
  email: 'membership-verify@local.test',
  name: 'Membership Verify User',
};

async function main() {
  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth(TEST_USER);

  const createdPlan = await membershipPlanService.createPlan({
    name: `Verify Plan ${Date.now()}`,
    price: 5000,
    currency: 'INR',
    validityDays: 7,
    downloadLimit: 3,
    active: true,
    sortOrder: 99,
  });
  results.test_create_plan = createdPlan.id ? 'PASS' : 'FAIL';

  const updatedPlan = await membershipPlanService.updatePlan(createdPlan.id, {
    downloadLimit: 5,
  });
  results.test_update_plan = updatedPlan.downloadLimit === 5 ? 'PASS' : 'FAIL';

  const membershipA = await membershipService.createMembership({
    userId: user.id,
    planId: 'plan_basic',
  });
  const membershipB = await membershipService.createMembership({
    userId: user.id,
    planId: 'plan_elite',
  });
  results.test_stack_memberships =
    membershipA.status === 'ACTIVE' && membershipB.status === 'ACTIVE' ? 'PASS' : 'FAIL';

  const remainingWithElite = await membershipService.calculateRemainingDownloads(user.id);
  results.test_unlimited_downloads = remainingWithElite.unlimited === true ? 'PASS' : 'FAIL';

  await membershipService.cancelMembership(membershipB.id);
  const cancelled = await membershipService.getMembership(membershipB.id);
  results.test_cancel_membership = cancelled?.status === 'CANCELLED' ? 'PASS' : 'FAIL';

  const limitedRemaining = await membershipService.calculateRemainingDownloads(user.id);
  results.test_limited_remaining =
    !limitedRemaining.unlimited && limitedRemaining.remainingDownloads !== null ? 'PASS' : 'FAIL';

  const expiryMembership = await membershipService.createMembership({
    userId: user.id,
    planId: 'plan_premium',
  });

  const store = (globalThis as { __mi_inmem_memberships__?: Map<string, { endDate: string }> })
    .__mi_inmem_memberships__;
  const past = new Date();
  past.setUTCDate(past.getUTCDate() - 1);
  const row = store?.get(expiryMembership.id);
  if (row) {
    row.endDate = past.toISOString();
    store.set(expiryMembership.id, row);
  }

  await membershipService.resolveActiveMembership(user.id);
  const expired = await membershipService.getMembership(expiryMembership.id);
  results.test_auto_expiry = expired?.status === 'EXPIRED' ? 'PASS' : `FAIL (${expired?.status ?? 'unknown'})`;

  await membershipPlanService.softDeletePlan(createdPlan.id);
  const deleted = await membershipPlanService.getPlan(createdPlan.id);
  results.test_soft_delete_plan = deleted === null ? 'PASS' : 'FAIL';

  const me = await membershipService.getMembershipMe(user.id);
  results.test_membership_summary = me.summary.hasMembership ? 'PASS' : 'FAIL';
  results.active_membership_count = String(me.activeMemberships.length);

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
