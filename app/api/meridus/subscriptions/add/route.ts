import { NextResponse } from 'next/server';
import { addSubscription } from '@/app/lib/subscriptions';

interface AddSubscriptionBody {
  channelId: string;
  repo: string;
  events?: string[];
  guildId?: string;
}

export async function POST(request: Request) {
  console.log('[Subscriptions API] Adding subscription');

  try {
    const body: AddSubscriptionBody = await request.json();

    if (!body.channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }

    if (!body.repo) {
      return NextResponse.json({ error: 'repo is required' }, { status: 400 });
    }

    const subscription = await addSubscription(
      body.channelId,
      body.repo,
      body.events || ['push', 'issues', 'pull_request'],
      body.guildId
    );

    console.log('[Subscriptions API] Added subscription:', subscription);

    return NextResponse.json({ 
      success: true,
      subscription 
    });
  } catch (err: any) {
    console.error('[Subscriptions API] Add error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to add subscription' },
      { status: 500 }
    );
  }
}
