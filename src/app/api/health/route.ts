import { NextResponse } from 'next/server';
import { getPublicHealth } from '@/lib/operations/health.service';
import { publicHealthResponseSchema } from '@/validations/operations.validation';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const health = await getPublicHealth();
    const parsed = publicHealthResponseSchema.safeParse(health);
    if (!parsed.success) {
      return NextResponse.json(
        { status: 'unhealthy', message: 'Health response validation failed' },
        { status: 500 },
      );
    }

    const statusCode =
      health.status === 'unhealthy' ? 503 : health.status === 'degraded' ? 200 : 200;

    return NextResponse.json(parsed.data, { status: statusCode });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed';
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: { status: 'unhealthy' },
        cloudinary: { status: 'unhealthy' },
        razorpay: { status: 'unhealthy' },
        worker: { status: 'stopped' },
        message,
      },
      { status: 503 },
    );
  }
}
