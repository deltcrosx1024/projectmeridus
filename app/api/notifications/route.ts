import { NextResponse } from 'next/server';
import { redis } from '@/app/lib/redis';

const NOTIFICATIONS_PREFIX = 'meridus:notifications:';
const USER_NOTIFICATIONS_KEY = (userId: string) => `${NOTIFICATIONS_PREFIX}${userId}`;

export interface Notification {
  id: string;
  type: 'webhook' | 'issue' | 'commit' | 'pr' | 'release' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: {
    repo?: string;
    url?: string;
    action?: string;
  };
}

const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const includeRead = searchParams.get('includeRead') === 'true';

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  try {
    const key = USER_NOTIFICATIONS_KEY(userId);
    const data = await redis.lrange(key, 0, 49);
    
    let notifications: Notification[] = [];
    if (data && data.length > 0) {
      notifications = data.map(item => {
        if (typeof item === 'string') {
          return JSON.parse(item) as Notification;
        }
        return item as Notification;
      });
    }

    if (!includeRead) {
      notifications = notifications.filter(n => !n.read);
    }

    return NextResponse.json(notifications);
  } catch (err) {
    console.error('[Notifications API] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data } = body;

    if (!userId || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const notification: Notification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      data,
    };

    const key = USER_NOTIFICATIONS_KEY(userId);
    
    await redis.lpush(key, JSON.stringify(notification));
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, TTL_SECONDS);

    return NextResponse.json({ success: true, notification });
  } catch (err) {
    console.error('[Notifications API] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const notificationId = searchParams.get('id');
  const action = searchParams.get('action');

  if (!userId || !notificationId) {
    return NextResponse.json({ error: 'userId and id required' }, { status: 400 });
  }

  try {
    const key = USER_NOTIFICATIONS_KEY(userId);
    const data = await redis.lrange(key, 0, 99);
    
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No notifications found' }, { status: 404 });
    }

    let notifications: Notification[] = data.map(item => {
      if (typeof item === 'string') {
        return JSON.parse(item) as Notification;
      }
      return item as Notification;
    });

    if (action === 'markRead') {
      notifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
    } else if (action === 'markAllRead') {
      notifications = notifications.map(n => ({ ...n, read: true }));
    } else if (action === 'delete') {
      notifications = notifications.filter(n => n.id !== notificationId);
    } else if (action === 'clearAll') {
      await redis.del(key);
      return NextResponse.json({ success: true });
    }

    await redis.del(key);
    if (notifications.length > 0) {
      const pipeline = redis.pipeline();
      for (const n of notifications) {
        pipeline.lpush(key, JSON.stringify(n));
      }
      pipeline.expire(key, TTL_SECONDS);
      await pipeline.exec();
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Notifications API] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
