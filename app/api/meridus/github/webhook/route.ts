import { NextResponse } from 'next/server';
import crypto from 'crypto';

const getBotUrl = (): string => {
  return process.env.MERIDUS_BOT_URL || 'http://localhost:3000';
};

const getApiKey = (): string => {
  return process.env.MERIDUS_API_KEY || '';
};

export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256');
  const event = request.headers.get('x-github-event');
  const deliveryId = request.headers.get('x-github-delivery');
  const body = await request.text();
  const botUrl = getBotUrl();
  const apiKey = getApiKey();

  console.log(`[MeridusBot Webhook] Received event: ${event}, delivery: ${deliveryId}`);

  if (!apiKey) {
    console.error('[MeridusBot Webhook] MERIDUS_API_KEY not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[MeridusBot Webhook] GITHUB_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!signature) {
    console.error('[MeridusBot Webhook] Missing signature header');
    return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
  }

  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const expected = `sha256=${hash}`;

  if (signature !== expected) {
    console.error('[MeridusBot Webhook] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  console.log('[MeridusBot Webhook] Signature verified, forwarding to bot');

  try {
    const response = await fetch(`${botUrl}/api/webhooks/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'x-hub-signature-256': signature,
        'x-github-event': event || '',
        'x-github-delivery': deliveryId || '',
      },
      body: body,
    });

    const responseData = await response.text();
    console.log(`[MeridusBot Webhook] Bot response: ${response.status}`, responseData);

    if (response.ok) {
      return NextResponse.json({ received: true, event, deliveryId });
    } else {
      return NextResponse.json(
        { error: 'Failed to forward to bot', botStatus: response.status },
        { status: response.status }
      );
    }
  } catch (err: any) {
    console.error('[MeridusBot Webhook] Forward error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
