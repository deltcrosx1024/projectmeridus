import { NextResponse } from 'next/server';
import { removeSubscription } from '@/app/lib/subscriptions';

interface RemoveSubscriptionBody {
  channelId: string;
  repo?: string;
}

export async function POST(request: Request) {
  console.log('[Subscriptions API] Removing subscription');

  try {
    const body: RemoveSubscriptionBody = await request.json();

    if (!body.channelId) {
      return NextResponse.json({ error: 'channelId is required' }, { status: 400 });
    }

    const removed = await removeSubscription(body.channelId, body.repo);

    if (!removed) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    console.log('[Subscriptions API] Removed subscription:', { channelId: body.channelId, repo: body.repo });

    return NextResponse.json({ 
      success: true,
      message: body.repo 
        ? `Unsubscribed from ${body.repo}`
        : 'Unsubscribed from all repositories'
    });
  } catch (err: any) {
    console.error('[Subscriptions API] Remove error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
