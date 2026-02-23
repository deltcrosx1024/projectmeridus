import { NextResponse } from 'next/server';

const getBotUrl = (): string => {
  return process.env.MERIDUS_BOT_URL || 'http://localhost:3000';
};

const getApiKey = (): string => {
  return process.env.MERIDUS_API_KEY || '';
};

interface RemoveSubscriptionBody {
  channelId: string;
  repo?: string;
}

export async function POST(request: Request) {
  const botUrl = getBotUrl();
  const apiKey = getApiKey();

  console.log('[MeridusBot] Removing subscription');

  if (!apiKey) {
    return NextResponse.json(
      { error: 'MERIDUS_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const body: RemoveSubscriptionBody = await request.json();

    if (!body.channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }

    const forwardBody = {
      action: 'remove',
      channelId: body.channelId,
      repo: body.repo || '',
    };

    console.log('[MeridusBot] Forwarding to bot:', forwardBody);

    const response = await fetch(`${botUrl}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(forwardBody),
    });

    const data = await response.json();
    console.log('[MeridusBot] Remove subscription response:', data);

    if (response.ok) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: data.error || 'Failed to remove subscription' }, { status: response.status });
    }
  } catch (err: any) {
    console.error('[MeridusBot] Remove subscription error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
