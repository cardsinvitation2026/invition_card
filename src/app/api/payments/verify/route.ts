import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { paymentVerificationService } from '@/features/payments';
import { verifyPaymentSchema } from '@/validations/payment.validation';
import type { ApiResponse } from '@/types/api';
import type { VerifyPaymentResult } from '@/types/payment';

export const runtime = 'nodejs';

function authError(error: unknown): NextResponse<ApiResponse<null>> | null {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  if (message === 'UNAUTHENTICATED') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Authentication required' },
      { status: 401 },
    );
  }
  if (message === 'USER_NOT_ACTIVE') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Account is not active' },
      { status: 403 },
    );
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'Validation failed',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await paymentVerificationService.verifyMembershipPurchase(
      session.userId,
      parsed.data,
    );

    return NextResponse.json<ApiResponse<VerifyPaymentResult>>({
      success: true,
      data: result,
      message: result.alreadyCompleted ? 'Payment already verified' : 'Payment verified',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to verify payment';
    if (message === 'INVALID_PAYMENT_SIGNATURE') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid payment signature' },
        { status: 400 },
      );
    }
    if (message === 'Order not found' || message === 'Membership plan not found') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message },
        { status: 404 },
      );
    }
    if (
      message === 'Order amount mismatch' ||
      message === 'Razorpay order mismatch' ||
      message === 'Membership plan is not available'
    ) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message },
        { status: 400 },
      );
    }
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
