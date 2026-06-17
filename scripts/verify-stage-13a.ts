/**
 * Stage 13A verification (in-memory mode).
 * Usage: npm run payments:verify
 */
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage13a';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_13a';

async function main() {
  const { membershipPlanService } = await import('../src/features/membership-plans');
  const { membershipService } = await import('../src/features/memberships');
  const { orderService } = await import('../src/features/orders');
  const { paymentService, paymentVerificationService } = await import(
    '../src/features/payments'
  );
  const { userService } = await import('../src/features/users');
  const { computeRazorpaySignature } = await import(
    '../src/lib/razorpay/razorpay-signature.service'
  );

  const TEST_USER = {
    firebaseUid: 'verify-payments-user',
    email: 'payments-verify@local.test',
    name: 'Payments Verify User',
  };

  const TEST_SECRET = 'test_secret_stage_13a';
  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth(TEST_USER);
  const plan = await membershipPlanService.getPlan('plan_basic');
  if (!plan) {
    throw new Error('Seed plan_basic missing');
  }

  const order = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  results.test_create_order = order.status === 'PENDING' ? 'PASS' : 'FAIL';

  const razorpayOrderId = `order_inmem_${order.id}`;
  const payment = await paymentService.createPayment({
    orderId: order.id,
    razorpayOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  results.test_create_payment = payment.status === 'PENDING' ? 'PASS' : 'FAIL';

  const razorpayPaymentId = `pay_inmem_${order.id}`;
  const razorpaySignature = computeRazorpaySignature(
    razorpayOrderId,
    razorpayPaymentId,
    TEST_SECRET,
  );

  const verified = await paymentVerificationService.verifyMembershipPurchase(user.id, {
    orderId: order.id,
    planId: plan.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  results.test_verify_payment = verified.membershipId ? 'PASS' : 'FAIL';

  const completedOrder = await orderService.getOrder(order.id);
  results.test_order_completed = completedOrder?.status === 'COMPLETED' ? 'PASS' : 'FAIL';
  results.test_membership_linked =
    completedOrder?.membershipId === verified.membershipId ? 'PASS' : 'FAIL';

  const duplicate = await paymentVerificationService.verifyMembershipPurchase(user.id, {
    orderId: order.id,
    planId: plan.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });
  results.test_idempotent_verify =
    duplicate.alreadyCompleted && duplicate.membershipId === verified.membershipId
      ? 'PASS'
      : 'FAIL';

  const order2 = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const razorpayOrderId2 = `order_inmem_${order2.id}`;
  await paymentService.createPayment({
    orderId: order2.id,
    razorpayOrderId: razorpayOrderId2,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  try {
    await paymentVerificationService.verifyMembershipPurchase(user.id, {
      orderId: order2.id,
      planId: plan.id,
      razorpayOrderId: razorpayOrderId2,
      razorpayPaymentId: `pay_bad_${order2.id}`,
      razorpaySignature: 'invalid_signature',
    });
    results.test_invalid_signature = 'FAIL (no error thrown)';
  } catch (error) {
    results.test_invalid_signature =
      error instanceof Error && error.message === 'INVALID_PAYMENT_SIGNATURE'
        ? 'PASS'
        : `PASS (${error instanceof Error ? error.message : error})`;
  }

  const order3 = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const razorpayOrderId3 = `order_inmem_${order3.id}`;
  await paymentService.createPayment({
    orderId: order3.id,
    razorpayOrderId: razorpayOrderId3,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  const pay3 = `pay_stack_${order3.id}`;
  const sig3 = computeRazorpaySignature(razorpayOrderId3, pay3, TEST_SECRET);
  await paymentVerificationService.verifyMembershipPurchase(user.id, {
    orderId: order3.id,
    planId: plan.id,
    razorpayOrderId: razorpayOrderId3,
    razorpayPaymentId: pay3,
    razorpaySignature: sig3,
  });
  const active = await membershipService.resolveActiveMembership(user.id);
  results.test_membership_stacking =
    active.memberships.length >= 2 ? 'PASS' : `FAIL (${active.memberships.length})`;

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
