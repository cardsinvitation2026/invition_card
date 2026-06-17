import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { paymentService } from '@/features/payments';
import { createCheckoutOrderSchema } from '@/validations/order.validation';
import type { ApiResponse } from '@/types/api';
import type { CreateCheckoutOrderResult } from '@/types/order';

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
    const parsed = createCheckoutOrderSchema.safeParse(body);
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

    const result = await paymentService.createCheckoutOrder(session.userId, parsed.data);
    return NextResponse.json<ApiResponse<CreateCheckoutOrderResult>>(
      { success: true, data: result },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create order';
    if (message === 'Membership plan not found') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message },
        { status: 404 },
      );
    }
    if (
      message === 'Membership plan is not active' ||
      message === 'Membership plan is not available' ||
      message === 'Razorpay is not configured.'
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
