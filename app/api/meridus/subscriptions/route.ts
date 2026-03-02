import { NextResponse } from 'next/server';
import { getAllSubscriptions } from '@/app/lib/subscriptions';

export async function GET() {
  console.log('[Subscriptions API] Listing all subscriptions');

  try {
    const subscriptions = await getAllSubscriptions();
    
    return NextResponse.json({ 
      subscriptions,
      count: subscriptions.length 
    });
  } catch (err: any) {
    console.error('[Subscriptions API] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list subscriptions' },
      { status: 500 }
    );
  }
}
