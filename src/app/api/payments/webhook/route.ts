import { NextRequest, NextResponse } from 'next/server';
import { razorpayWebhookSignatureService } from '@/lib/razorpay/razorpay-webhook-signature.service';
import { razorpayWebhookService } from '@/lib/razorpay/razorpay-webhook.service';
import { razorpayWebhookBodySchema } from '@/validations/razorpay-webhook.validation';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const valid = razorpayWebhookSignatureService.verifyWebhookSignature(
      rawBody,
      signature,
    );
    if (!valid) {
      return NextResponse.json({ message: 'Invalid webhook signature' }, { status: 400 });
    }

    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ message: 'Invalid webhook payload' }, { status: 400 });
    }

    const parsed = razorpayWebhookBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid webhook payload' }, { status: 400 });
    }

    const result = await razorpayWebhookService.processWebhookEvent(parsed.data);
    void result;
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error(
      'Razorpay webhook processing failed:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json({ message: 'Webhook processing failed' }, { status: 500 });
  }
}
