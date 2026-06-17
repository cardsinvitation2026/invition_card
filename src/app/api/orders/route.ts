import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { orderService } from '@/features/orders';
import { orderListQuerySchema } from '@/validations/order.validation';
import type { ApiResponse } from '@/types/api';
import type { OrderListResult } from '@/types/order';

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

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();
    const raw = Object.fromEntries(req.nextUrl.searchParams.entries());
    const parsed = orderListQuerySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          data: null,
          message: 'Invalid query parameters',
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = await orderService.listOrdersByUser(session.userId, parsed.data);
    return NextResponse.json<ApiResponse<OrderListResult>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list orders';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
