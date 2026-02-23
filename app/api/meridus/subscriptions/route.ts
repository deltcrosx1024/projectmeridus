import { NextResponse } from 'next/server';

const getBotUrl = (): string => {
  return process.env.MERIDUS_BOT_URL || 'http://localhost:3000';
};

const getApiKey = (): string => {
  return process.env.MERIDUS_API_KEY || '';
};

export async function GET() {
  const botUrl = getBotUrl();
  const apiKey = getApiKey();

  console.log('[MeridusBot Subscriptions] Listing all subscriptions');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'MERIDUS_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${botUrl}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ action: 'list' }),
    });

    const data = await response.json();
    console.log('[MeridusBot Subscriptions] Response:', data);

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: data.error || 'Failed to list subscriptions' }, { status: response.status });
    }
  } catch (err: any) {
    console.error('[MeridusBot Subscriptions] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
