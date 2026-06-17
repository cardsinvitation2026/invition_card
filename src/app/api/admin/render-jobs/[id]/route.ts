import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth/server';
import { renderJobService } from '@/features/render-jobs';
import { renderJobIdSchema } from '@/validations/render-job.validation';
import { enrichRenderJobs } from '@/lib/admin/render-job-enrichment';
import type { ApiResponse } from '@/types/api';
import type { AdminRenderJobDetail } from '@/types/admin-render-job';

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
    const session = await requireSuperAdmin();
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

    const [enriched] = await enrichRenderJobs([job]);
    const data: AdminRenderJobDetail = {
      ...enriched,
      startedAt: job.startedAt,
      previewUrl: job.previewUrl,
    };

    return NextResponse.json<ApiResponse<AdminRenderJobDetail>>({
      success: true,
      data,
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
