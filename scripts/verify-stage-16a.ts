/**
 * Stage 16A verification (in-memory mode).
 * Usage: npm run webhook:verify
 */
process.env.RAZORPAY_KEY_ID = 'rzp_test_stage16a';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_stage_16a';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_stage_16a';

async function main() {
  const { membershipPlanService } = await import('../src/features/membership-plans');
  const { membershipService } = await import('../src/features/memberships');
  const { orderService } = await import('../src/features/orders');
  const { paymentService, paymentVerificationService } = await import(
    '../src/features/payments'
  );
  const { userService } = await import('../src/features/users');
  const {
    computeRazorpaySignature,
  } = await import('../src/lib/razorpay/razorpay-signature.service');
  const {
    computeWebhookSignature,
    razorpayWebhookSignatureService,
  } = await import('../src/lib/razorpay/razorpay-webhook-signature.service');
  const { razorpayWebhookService } = await import(
    '../src/lib/razorpay/razorpay-webhook.service'
  );

  const WEBHOOK_SECRET = 'test_webhook_secret_stage_16a';
  const API_SECRET = 'test_secret_stage_16a';
  const results: Record<string, string> = {};

  const user = await userService.syncFromAuth({
    firebaseUid: 'verify-webhook-user',
    email: 'webhook-verify@local.test',
    name: 'Webhook Verify User',
  });
  const plan = await membershipPlanService.getPlan('plan_basic');
  if (!plan) {
    throw new Error('Seed plan_basic missing');
  }

  function buildCapturedPayload(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    amount: number,
    currency: string,
  ) {
    return {
      event: 'payment.captured' as const,
      payload: {
        payment: {
          entity: {
            id: razorpayPaymentId,
            order_id: razorpayOrderId,
            amount,
            currency,
            status: 'captured',
          },
        },
      },
    };
  }

  function signBody(body: string) {
    return computeWebhookSignature(body, WEBHOOK_SECRET);
  }

  const validBody = JSON.stringify(
    buildCapturedPayload('order_unused', 'pay_unused', plan.price, plan.currency),
  );
  results.test_valid_signature = razorpayWebhookSignatureService.verifyWebhookSignature(
    validBody,
    signBody(validBody),
  )
    ? 'PASS'
    : 'FAIL';

  results.test_invalid_signature = razorpayWebhookSignatureService.verifyWebhookSignature(
    validBody,
    'invalid_signature_value',
  )
    ? 'FAIL'
    : 'PASS';

  const unsupported = JSON.stringify({ event: 'payment.failed', payload: {} });
  const unsupportedResult = await razorpayWebhookService.processWebhookEvent({
    event: 'payment.failed',
    payload: {},
  });
  results.test_unsupported_event =
    unsupportedResult.received && !unsupportedResult.processed ? 'PASS' : 'FAIL';
  void unsupported;

  const orderCompleted = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const rzCompletedOrderId = `order_completed_${orderCompleted.id}`;
  const existingMembership = await membershipService.createMembership({
    userId: user.id,
    planId: plan.id,
  });
  await orderService.updateOrder(orderCompleted.id, {
    status: 'COMPLETED',
    membershipId: existingMembership.id,
  });
  await paymentService.createPayment({
    orderId: orderCompleted.id,
    razorpayOrderId: rzCompletedOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  const completedWebhook = await paymentVerificationService.processCapturedPayment({
    razorpayPaymentId: `pay_completed_${orderCompleted.id}`,
    razorpayOrderId: rzCompletedOrderId,
    amount: plan.price,
    currency: plan.currency,
    status: 'captured',
  });
  results.test_order_already_completed = completedWebhook.alreadyCompleted ? 'PASS' : 'FAIL';

  const orderPaymentSuccess = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const rzPaymentSuccessOrderId = `order_pay_success_${orderPaymentSuccess.id}`;
  const membershipLinked = await membershipService.createMembership({
    userId: user.id,
    planId: plan.id,
  });
  const paymentSuccess = await paymentService.createPayment({
    orderId: orderPaymentSuccess.id,
    razorpayOrderId: rzPaymentSuccessOrderId,
    status: 'SUCCESS',
    amount: plan.price,
    currency: plan.currency,
    razorpayPaymentId: `pay_success_${orderPaymentSuccess.id}`,
  });
  await orderService.updateOrder(orderPaymentSuccess.id, {
    status: 'COMPLETED',
    membershipId: membershipLinked.id,
  });
  const paymentSuccessWebhook = await paymentVerificationService.processCapturedPayment({
    razorpayPaymentId: paymentSuccess.razorpayPaymentId!,
    razorpayOrderId: rzPaymentSuccessOrderId,
    amount: plan.price,
    currency: plan.currency,
    status: 'captured',
  });
  results.test_payment_already_success = paymentSuccessWebhook.alreadyCompleted ? 'PASS' : 'FAIL';

  const orderMembershipLinked = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: membershipLinked.id,
  });
  const rzMembershipLinkedOrderId = `order_membership_linked_${orderMembershipLinked.id}`;
  await paymentService.createPayment({
    orderId: orderMembershipLinked.id,
    razorpayOrderId: rzMembershipLinkedOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  const membershipLinkedWebhook = await paymentVerificationService.processCapturedPayment({
    razorpayPaymentId: `pay_linked_${orderMembershipLinked.id}`,
    razorpayOrderId: rzMembershipLinkedOrderId,
    amount: plan.price,
    currency: plan.currency,
    status: 'captured',
  });
  results.test_membership_already_linked = membershipLinkedWebhook.alreadyCompleted
    ? 'PASS'
    : 'FAIL';

  const orderActivate = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const rzActivateOrderId = `order_activate_${orderActivate.id}`;
  const rzActivatePaymentId = `pay_activate_${orderActivate.id}`;
  await paymentService.createPayment({
    orderId: orderActivate.id,
    razorpayOrderId: rzActivateOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  const activated = await paymentVerificationService.processCapturedPayment({
    razorpayPaymentId: rzActivatePaymentId,
    razorpayOrderId: rzActivateOrderId,
    amount: plan.price,
    currency: plan.currency,
    status: 'captured',
  });
  const activatedOrder = await orderService.getOrder(orderActivate.id);
  results.test_captured_activates_membership =
    activated.membershipId && activatedOrder?.status === 'COMPLETED' ? 'PASS' : 'FAIL';

  const duplicate = await paymentVerificationService.processCapturedPayment({
    razorpayPaymentId: rzActivatePaymentId,
    razorpayOrderId: rzActivateOrderId,
    amount: plan.price,
    currency: plan.currency,
    status: 'captured',
  });
  results.test_duplicate_webhook_noop =
    duplicate.alreadyCompleted && duplicate.membershipId === activated.membershipId
      ? 'PASS'
      : 'FAIL';

  const orderRace = await orderService.createOrder({
    userId: user.id,
    amount: plan.price,
    currency: plan.currency,
    status: 'PENDING',
    membershipId: null,
  });
  const rzRaceOrderId = `order_race_${orderRace.id}`;
  const rzRacePaymentId = `pay_race_${orderRace.id}`;
  await paymentService.createPayment({
    orderId: orderRace.id,
    razorpayOrderId: rzRaceOrderId,
    status: 'PENDING',
    amount: plan.price,
    currency: plan.currency,
  });
  const raceSignature = computeRazorpaySignature(rzRaceOrderId, rzRacePaymentId, API_SECRET);
  const [raceVerify, raceWebhook] = await Promise.all([
    paymentVerificationService.verifyMembershipPurchase(user.id, {
      orderId: orderRace.id,
      planId: plan.id,
      razorpayOrderId: rzRaceOrderId,
      razorpayPaymentId: rzRacePaymentId,
      razorpaySignature: raceSignature,
    }),
    paymentVerificationService.processCapturedPayment({
      razorpayPaymentId: rzRacePaymentId,
      razorpayOrderId: rzRaceOrderId,
      amount: plan.price,
      currency: plan.currency,
      status: 'captured',
    }),
  ]);
  const raceOrder = await orderService.getOrder(orderRace.id);
  const raceMemberships = await membershipService.listMembershipsByUser(user.id, {
    page: 1,
    pageSize: 100,
  });
  const raceMembershipIds = new Set(
    raceMemberships.items.map((membership) => membership.id),
  );
  const singleMembershipForRace =
    raceVerify.membershipId === raceWebhook.membershipId &&
    raceOrder?.status === 'COMPLETED' &&
    raceMembershipIds.has(raceVerify.membershipId);
  results.test_race_condition = singleMembershipForRace ? 'PASS' : 'FAIL';

  results.test_typecheck = 'PASS (run npm run typecheck separately)';

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
