import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { membershipPlanService } from '@/features/membership-plans';
import {
  membershipPlanIdSchema,
  membershipPlanUpdateSchema,
} from '@/validations/membership-plan.validation';
import type { ApiResponse } from '@/types/api';
import type { MembershipPlanDetail } from '@/types/membership-plan';

export const runtime = 'nodejs';

function authError(error: unknown): NextResponse<ApiResponse<null>> | null {
  const message = error instanceof Error ? error.message : 'Unauthorized';
  if (message === 'UNAUTHENTICATED') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Authentication required' },
      { status: 401 },
    );
  }
  if (message === 'FORBIDDEN' || message === 'USER_NOT_ACTIVE') {
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message: 'Forbidden' },
      { status: 403 },
    );
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = membershipPlanIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid membership plan id' },
        { status: 400 },
      );
    }

    const plan = await membershipPlanService.getPlan(parsedId.data);
    if (!plan) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Membership plan not found' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<{ plan: MembershipPlanDetail }>>({
      success: true,
      data: { plan },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get membership plan';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = membershipPlanIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid membership plan id' },
        { status: 400 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = membershipPlanUpdateSchema.safeParse(body);
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

    const existing = await membershipPlanService.getPlan(parsedId.data);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Membership plan not found' },
        { status: 404 },
      );
    }

    const plan = await membershipPlanService.updatePlan(parsedId.data, parsed.data);
    return NextResponse.json<ApiResponse<{ plan: MembershipPlanDetail }>>({
      success: true,
      data: { plan },
      message: 'Membership plan updated',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to update membership plan';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const parsedId = membershipPlanIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid membership plan id' },
        { status: 400 },
      );
    }

    const existing = await membershipPlanService.getPlan(parsedId.data);
    if (!existing) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Membership plan not found' },
        { status: 404 },
      );
    }

    await membershipPlanService.softDeletePlan(parsedId.data);
    return NextResponse.json<ApiResponse<null>>({
      success: true,
      data: null,
      message: 'Membership plan deleted',
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to delete membership plan';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
