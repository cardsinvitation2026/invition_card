import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/server';
import { renderJobService } from '@/features/render-jobs';
import { redactCustomerRenderJob } from '@/features/render-jobs/customer-render-job';
import { renderJobIdSchema } from '@/validations/render-job.validation';
import type { ApiResponse } from '@/types/api';
import type { RenderJobDetail } from '@/types/render-job';

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

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const parsedId = renderJobIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Invalid render job id' },
        { status: 400 },
      );
    }

    const job = await renderJobService.getRenderJob(session, parsedId.data);
    if (!job) {
      return NextResponse.json<ApiResponse<null>>(
        { success: false, data: null, message: 'Render job not found' },
        { status: 404 },
      );
    }

    return NextResponse.json<ApiResponse<RenderJobDetail>>({
      success: true,
      data: redactCustomerRenderJob(job),
    });
  } catch (error) {
    const auth = authError(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : 'Failed to get render job';
    return NextResponse.json<ApiResponse<null>>(
      { success: false, data: null, message },
      { status: 500 },
    );
  }
}
