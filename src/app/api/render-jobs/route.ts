import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { renderJobService } from '@/features/render-jobs';
import { redactCustomerRenderJob, redactCustomerRenderJobs } from '@/features/render-jobs/customer-render-job';
import {
  renderJobCreateSchema,
  renderJobListQuerySchema,
} from '@/validations/render-job.validation';
import type { ApiResponse } from '@/types/api';
import type { RenderJobDetail, RenderJobListResult } from '@/types/render-job';

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
    const parsed = renderJobListQuerySchema.safeParse(raw);
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

    const result = await renderJobService.listRenderJobs(session, parsed.data);
    return NextResponse.json<ApiResponse<RenderJobListResult>>({
      success: true,
      data: {
        ...result,
        items: redactCustomerRenderJobs(result.items),
      },
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to list render jobs';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const body = await req.json().catch(() => ({}));
    const parsed = renderJobCreateSchema.safeParse(body);
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

    const job = await renderJobService.createRenderJob(session.userId, parsed.data);
    return NextResponse.json<ApiResponse<RenderJobDetail>>(
      { success: true, data: redactCustomerRenderJob(job), message: 'Render job created' },
      { status: 201 },
    );
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to create render job';
    if (message === 'Draft not found' || message === 'Template not found') {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message },
        { status: 404 },
      );
    }
    if (message === 'Draft template mismatch') {
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
