/**
 * Stage 16F verification (in-memory mode).
 * Usage: npm run fulfillment:verify
 */
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage16f';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_16f';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_stage_16f';

async function countMembershipsForUser(
  membershipService: Awaited<
    ReturnType<typeof import('../src/features/memberships')>['membershipService']
  >,
  userId: string,
) {
  const page = await membershipService.listMembershipsByUser(userId, {
    page: 1,
    pageSize: 500,
  });
  return page.items.length;
}

async function createPendingPurchase(
  userId: string,
  plan: { id: string; price: number; currency: string },
  orderService: Awaited<
    ReturnType<typeof import('../src/features/orders')>['orderService']
  >,
  paymentService: Awaited<
    ReturnType<typeof import('../src/features/payments')>['paymentService']
  >,
  suffix: string,
) {
  const order = await orderService.createOrder({
    userId,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const razorpayOrderId = `order_${suffix}_${order.id}`;
  const payment = await paymentService.createPayment({
    orderId: order.id,
    razorpayOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  const razorpayPaymentId = `pay_${suffix}_${order.id}`;
  return { order, payment, razorpayOrderId, razorpayPaymentId };
}

async function main() {
  const { membershipPlanService } = await import('../src/features/membership-plans');
  const { membershipService } = await import('../src/features/memberships');
  const { orderService } = await import('../src/features/orders');
  const { paymentService, paymentVerificationService } = await import(
    '../src/features/payments'
  );
  const { fulfillPurchaseHardened } = await import(
    '../src/features/payments/payment-fulfillment.engine'
  );
  const { userService } = await import('../src/features/users');
  const { computeRazorpaySignature } = await import(
    '../src/lib/razorpay/razorpay-signature.service'
  );

  const API_SECRET = 'test_secret_stage_16f';
  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-fulfillment-user',
    email: 'fulfillment-verify@local.test',
    name: 'Fulfillment Verify User',
  });
  const plan = await membershipPlanService.getPlan('plan_basic');
  if (!plan) {
    throw new Error('Seed plan_basic missing');
  }

  const verifyInput = (
    orderId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
  ) => ({
    orderId,
    planId: plan.id,
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  const webhookInput = (
    razorpayOrderId: string,
    razorpayPaymentId: string,
  ) => ({
    razorpayPaymentId,
    razorpayOrderId,
    amount: plan.price,
    currency: plan.currency,
    status: 'captured' as const,
  });

  // test_browser_verify_duplicate
  {
    const { order, razorpayOrderId, razorpayPaymentId } = await createPendingPurchase(
      user.id,
      plan,
      orderService,
      paymentService,
      'verify_dup',
    );
    const signature = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId, API_SECRET);
    const first = await paymentVerificationService.verifyMembershipPurchase(
      user.id,
      verifyInput(order.id, razorpayOrderId, razorpayPaymentId, signature),
    );
    const second = await paymentVerificationService.verifyMembershipPurchase(
      user.id,
      verifyInput(order.id, razorpayOrderId, razorpayPaymentId, signature),
    );
    results.test_browser_verify_duplicate =
      first.membershipId &&
      second.alreadyCompleted &&
      second.membershipId === first.membershipId
        ? 'PASS'
        : 'FAIL';
  }

  // test_webhook_duplicate
  {
    const { order, razorpayOrderId, razorpayPaymentId } = await createPendingPurchase(
      user.id,
      plan,
      orderService,
      paymentService,
      'webhook_dup',
    );
    const first = await paymentVerificationService.processCapturedPayment(
      webhookInput(razorpayOrderId, razorpayPaymentId),
    );
    const second = await paymentVerificationService.processCapturedPayment(
      webhookInput(razorpayOrderId, razorpayPaymentId),
    );
    results.test_webhook_duplicate =
      first.membershipId &&
      second.alreadyCompleted &&
      second.membershipId === first.membershipId
        ? 'PASS'
        : 'FAIL';
  }

  // test_verify_and_webhook_race
  {
    const before = await countMembershipsForUser(membershipService, user.id);
    const { order, razorpayOrderId, razorpayPaymentId } = await createPendingPurchase(
      user.id,
      plan,
      orderService,
      paymentService,
      'race_vw',
    );
    const signature = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId, API_SECRET);
    const [verifyResult, webhookResult] = await Promise.all([
      paymentVerificationService.verifyMembershipPurchase(
        user.id,
        verifyInput(order.id, razorpayOrderId, razorpayPaymentId, signature),
      ),
      paymentVerificationService.processCapturedPayment(
        webhookInput(razorpayOrderId, razorpayPaymentId),
      ),
    ]);
    const after = await countMembershipsForUser(membershipService, user.id);
    const raceOrder = await orderService.getOrder(order.id);
    results.test_verify_and_webhook_race =
      verifyResult.membershipId === webhookResult.membershipId &&
      raceOrder?.status === 'COMPLETED' &&
      after === before + 1
        ? 'PASS'
        : 'FAIL';
  }

  // test_multiple_webhooks_same_order
  {
    const before = await countMembershipsForUser(membershipService, user.id);
    const { order, razorpayOrderId, razorpayPaymentId } = await createPendingPurchase(
      user.id,
      plan,
      orderService,
      paymentService,
      'multi_webhook',
    );
    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () =>
        paymentVerificationService.processCapturedPayment(
          webhookInput(razorpayOrderId, razorpayPaymentId),
        ),
      ),
    );
    const after = await countMembershipsForUser(membershipService, user.id);
    const membershipIds = new Set(outcomes.map((result) => result.membershipId));
    results.test_multiple_webhooks_same_order =
      membershipIds.size === 1 && after === before + 1 ? 'PASS' : 'FAIL';
  }

  // test_multiple_verify_calls_same_order
  {
    const before = await countMembershipsForUser(membershipService, user.id);
    const { order, razorpayOrderId, razorpayPaymentId } = await createPendingPurchase(
      user.id,
      plan,
      orderService,
      paymentService,
      'multi_verify',
    );
    const signature = computeRazorpaySignature(razorpayOrderId, razorpayPaymentId, API_SECRET);
    const outcomes = await Promise.all(
      Array.from({ length: 5 }, () =>
        paymentVerificationService.verifyMembershipPurchase(
          user.id,
          verifyInput(order.id, razorpayOrderId, razorpayPaymentId, signature),
        ),
      ),
    );
    const after = await countMembershipsForUser(membershipService, user.id);
    const membershipIds = new Set(outcomes.map((result) => result.membershipId));
    results.test_multiple_verify_calls_same_order =
      membershipIds.size === 1 && after === before + 1 ? 'PASS' : 'FAIL';
  }

  // test_order_completed_no_second_membership
  {
    const existingMembership = await membershipService.createMembership({
      userId: user.id,
      planId: plan.id,
    });
    const order = await orderService.createOrder({
      userId: user.id,
      amount: plan.price,
      currency: plan.currency,
      status: 'COMPLETED',
      membershipId: existingMembership.id,
    });
    const razorpayOrderId = `order_completed_${order.id}`;
    await paymentService.createPayment({
      orderId: order.id,
      razorpayOrderId,
      status: 'PENDING',
      amount: plan.price,
      currency: plan.currency,
    });
    const before = await countMembershipsForUser(membershipService, user.id);
    const result = await paymentVerificationService.processCapturedPayment(
      webhookInput(razorpayOrderId, `pay_completed_${order.id}`),
    );
    const after = await countMembershipsForUser(membershipService, user.id);
    results.test_order_completed_no_second_membership =
      result.alreadyCompleted &&
      result.membershipId === existingMembership.id &&
      after === before
        ? 'PASS'
        : 'FAIL';
  }

  // test_existing_membership_returned
  {
    const linkedMembership = await membershipService.createMembership({
      userId: user.id,
      planId: plan.id,
    });
    const order = await orderService.createOrder({
      userId: user.id,
      amount: plan.price,
      currency: plan.currency,
      status: 'PENDING',
      membershipId: linkedMembership.id,
    });
    const razorpayOrderId = `order_linked_${order.id}`;
    await paymentService.createPayment({
      orderId: order.id,
      razorpayOrderId,
      status: 'PENDING',
      amount: plan.price,
      currency: plan.currency,
    });
    const result = await paymentVerificationService.processCapturedPayment(
      webhookInput(razorpayOrderId, `pay_linked_${order.id}`),
    );
    results.test_existing_membership_returned =
      result.alreadyCompleted && result.membershipId === linkedMembership.id ? 'PASS' : 'FAIL';
  }

  // test_payment_success_noop
  {
    const linkedMembership = await membershipService.createMembership({
      userId: user.id,
      planId: plan.id,
    });
    const order = await orderService.createOrder({
      userId: user.id,
      amount: plan.price,
      currency: plan.currency,
      status: 'COMPLETED',
      membershipId: linkedMembership.id,
    });
    const razorpayOrderId = `order_pay_success_${order.id}`;
    const razorpayPaymentId = `pay_success_${order.id}`;
    await paymentService.createPayment({
      orderId: order.id,
      razorpayOrderId,
      status: 'SUCCESS',
      amount: plan.price,
      currency: plan.currency,
      razorpayPaymentId,
    });
    const before = await countMembershipsForUser(membershipService, user.id);
    const result = await paymentVerificationService.processCapturedPayment(
      webhookInput(razorpayOrderId, razorpayPaymentId),
    );
    const after = await countMembershipsForUser(membershipService, user.id);
    results.test_payment_success_noop =
      result.alreadyCompleted &&
      result.membershipId === linkedMembership.id &&
      after === before
        ? 'PASS'
        : 'FAIL';
  }

  // test_atomic_claim_single_winner
  {
    const before = await countMembershipsForUser(membershipService, user.id);
    const { order, payment, razorpayOrderId, razorpayPaymentId } =
      await createPendingPurchase(user.id, plan, orderService, paymentService, 'atomic');
    const outcomes = await Promise.all(
      Array.from({ length: 8 }, () =>
        fulfillPurchaseHardened({
          order,
          payment,
          planId: plan.id,
          razorpayPaymentId,
          razorpaySignature: null,
        }),
      ),
    );
    const after = await countMembershipsForUser(membershipService, user.id);
    const membershipIds = new Set(outcomes.map((result) => result.membershipId));
    const completedOrder = await orderService.getOrder(order.id);
    results.test_atomic_claim_single_winner =
      membershipIds.size === 1 &&
      after === before + 1 &&
      completedOrder?.status === 'COMPLETED' &&
      completedOrder.membershipId === outcomes[0]?.membershipId
        ? 'PASS'
        : 'FAIL';
  }

  // test_transaction_rollback
  {
    const { order, payment, razorpayPaymentId } = await createPendingPurchase(
      user.id,
      plan,
      orderService,
      paymentService,
      'rollback',
    );
    const before = await countMembershipsForUser(membershipService, user.id);
    try {
      await fulfillPurchaseHardened({
        order,
        payment,
        planId: 'plan_nonexistent',
        razorpayPaymentId,
        razorpaySignature: null,
      });
      results.test_transaction_rollback = 'FAIL (expected error)';
    } catch {
      const reloadedPayment = await paymentService.getPayment(payment.id);
      const reloadedOrder = await orderService.getOrder(order.id);
      const after = await countMembershipsForUser(membershipService, user.id);
      results.test_transaction_rollback =
        reloadedPayment?.status === 'PENDING' &&
        reloadedOrder?.status === 'PENDING' &&
        after === before
          ? 'PASS'
          : 'FAIL';
    }
  }

  console.log(JSON.stringify(results, null, 2));

  const failed = Object.entries(results).filter(([, value]) => value !== 'PASS');
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
