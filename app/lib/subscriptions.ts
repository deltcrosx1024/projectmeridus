// lib/subscriptions.ts
// Redis-based subscription storage for Discord bot
// Compatible with Vercel serverless environment

import { redis } from './redis';

export interface Subscription {
  id: string;
  channelId: string;
  repo: string;
  events: string[];
  createdAt: string;
  guildId?: string;
}

const SUBSCRIPTIONS_KEY = 'meridus:subscriptions';
const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year (subscriptions persist long-term)

/**
 * Get all subscriptions from Redis
 */
export async function loadSubscriptions(): Promise<Subscription[]> {
  try {
    const data = await redis.get<string>(SUBSCRIPTIONS_KEY);
    if (!data) {
      return [];
    }

    // Handle both string and already-parsed object
    if (typeof data === 'string') {
      return JSON.parse(data) as Subscription[];
    } else if (Array.isArray(data)) {
      return data as Subscription[];
    } else {
      console.error('[Subscriptions] Unexpected data type:', typeof data, data);
      return [];
    }
  } catch (error) {
    console.error('[Subscriptions] Error loading from Redis:', error);
    return [];
  }
}

/**
 * Save all subscriptions to Redis
 */
export async function saveSubscriptions(subscriptions: Subscription[]): Promise<void> {
  try {
    await redis.setex(SUBSCRIPTIONS_KEY, TTL_SECONDS, JSON.stringify(subscriptions));
  } catch (error) {
    console.error('[Subscriptions] Error saving to Redis:', error);
    throw error;
  }
}

/**
 * Add a subscription
 */
export async function addSubscription(
  channelId: string,
  repo: string,
  events: string[] = ['push', 'issues', 'pull_request'],
  guildId?: string
): Promise<Subscription> {
  const subscriptions = await loadSubscriptions();

  // Check if already exists
  const existingIndex = subscriptions.findIndex(
    (s) => s.channelId === channelId && s.repo.toLowerCase() === repo.toLowerCase()
  );

  const newSubscription: Subscription = {
    id: `${channelId}-${repo}`,
    channelId,
    repo: repo.toLowerCase(),
    events,
    createdAt: new Date().toISOString(),
    guildId,
  };

  if (existingIndex >= 0) {
    // Update existing
    subscriptions[existingIndex] = newSubscription;
  } else {
    // Add new
    subscriptions.push(newSubscription);
  }

  await saveSubscriptions(subscriptions);
  console.log(`[Subscriptions] Added: ${repo} for channel ${channelId}`);
  return newSubscription;
}

/**
 * Remove a subscription
 */
export async function removeSubscription(channelId: string, repo?: string): Promise<boolean> {
  const subscriptions = await loadSubscriptions();

  const initialLength = subscriptions.length;

  let filtered: Subscription[];
  if (repo) {
    // Remove specific repo subscription
    filtered = subscriptions.filter(
      (s) => !(s.channelId === channelId && s.repo.toLowerCase() === repo.toLowerCase())
    );
  } else {
    // Remove all subscriptions for this channel
    filtered = subscriptions.filter((s) => s.channelId !== channelId);
  }

  if (filtered.length === initialLength) {
    return false; // Nothing was removed
  }

  await saveSubscriptions(filtered);
  console.log(`[Subscriptions] Removed: ${repo || 'all'} for channel ${channelId}`);
  return true;
}

/**
 * Get subscriptions for a channel
 */
export async function getChannelSubscriptions(channelId: string): Promise<Subscription[]> {
  const subscriptions = await loadSubscriptions();
  return subscriptions.filter((s) => s.channelId === channelId);
}

/**
 * Get subscriptions for a repository
 */
export async function getRepoSubscriptions(repo: string): Promise<Subscription[]> {
  const subscriptions = await loadSubscriptions();
  return subscriptions.filter((s) => s.repo.toLowerCase() === repo.toLowerCase());
}

/**
 * Get all subscriptions
 */
export async function getAllSubscriptions(): Promise<Subscription[]> {
  return loadSubscriptions();
}

/**
 * Get subscription count
 */
export async function getSubscriptionCount(): Promise<number> {
  const subscriptions = await loadSubscriptions();
  return subscriptions.length;
}

/**
 * Clear all subscriptions (for testing/admin)
 */
export async function clearAllSubscriptions(): Promise<void> {
  await redis.del(SUBSCRIPTIONS_KEY);
}
