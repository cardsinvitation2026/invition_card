import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { orderService } from '@/features/orders';
import { paymentService } from '@/features/payments';
import { membershipService } from '@/features/memberships';
import { purchaseListQuerySchema } from '@/validations/purchase.validation';
import type { ApiResponse } from '@/types/api';
import type { PurchaseHistoryResult } from '@/types/account-dashboard';

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
    const parsed = purchaseListQuerySchema.safeParse(raw);
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

    const orders = await orderService.listOrdersByUser(session.userId, parsed.data);
    const items = await Promise.all(
      orders.items.map(async (order) => {
        const payment = await paymentService.getPaymentByOrderId(order.id);
        const membership = order.membershipId
          ? await membershipService.getMembership(order.membershipId)
          : null;

        return {
          orderId: order.id,
          date: order.createdAt,
          amount: order.amount,
          currency: order.currency,
          orderStatus: order.status,
          paymentStatus: payment?.status ?? null,
          planName: membership?.plan?.name ?? null,
          membershipStatus: membership?.status ?? null,
          membershipId: order.membershipId,
        };
      }),
    );

    const data: PurchaseHistoryResult = {
      items,
      total: orders.total,
      page: orders.page,
      pageSize: orders.pageSize,
      pageCount: orders.pageCount,
    };

    return NextResponse.json<ApiResponse<PurchaseHistoryResult>>({
      success: true,
      data,
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to load purchases';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
