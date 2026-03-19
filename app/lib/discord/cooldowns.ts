// lib/discord/cooldowns.ts
// Command cooldown system to prevent spam
// Uses Redis for persistence across serverless instances

import { redis } from '../redis';

const COOLDOWN_PREFIX = 'meridus:cooldown:';

interface CooldownEntry {
  userId: string;
  command: string;
  timestamp: number;
}

// Default cooldowns in seconds
export const DEFAULT_COOLDOWNS: Record<string, number> = {
  repos: 30,
  issues: 15,
  commits: 15,
  pr: 20,
  search: 10,
  status: 5,
  ping: 5,
  test: 60,
  subscribe: 10,
  unsubscribe: 10,
  list: 5,
  default: 5,
};

function getCooldownKey(userId: string, command: string): string {
  return `${COOLDOWN_PREFIX}${userId}:${command}`;
}

/**
 * Check if user is on cooldown for a command
 * Returns remaining seconds if on cooldown, 0 if not
 */
export async function checkCooldown(userId: string, command: string): Promise<number> {
  const key = getCooldownKey(userId, command);
  const cooldownSeconds = DEFAULT_COOLDOWNS[command] || DEFAULT_COOLDOWNS.default;
  
  try {
    const data = await redis.get<string>(key);
    if (!data) return 0;
    
    const entry = JSON.parse(data);
    const lastUsed = entry.timestamp;
    
    const now = Date.now();
    const elapsed = (now - lastUsed) / 1000;
    const remaining = Math.ceil(cooldownSeconds - elapsed);
    
    return remaining > 0 ? remaining : 0;
  } catch (err) {
    console.error('[Cooldowns] Error checking cooldown:', err);
    return 0;
  }
}

/**
 * Set cooldown for a user and command
 */
export async function setCooldown(userId: string, command: string): Promise<void> {
  const key = getCooldownKey(userId, command);
  const cooldownSeconds = DEFAULT_COOLDOWNS[command] || DEFAULT_COOLDOWNS.default;
  
  const entry: CooldownEntry = {
    userId,
    command,
    timestamp: Date.now(),
  };
  
  try {
    await redis.setex(key, cooldownSeconds, JSON.stringify(entry));
  } catch (err) {
    console.error('[Cooldowns] Error setting cooldown:', err);
  }
}

/**
 * Clear all cooldowns (for admin use)
 */
export async function clearCooldowns(): Promise<void> {
  try {
    const keys: string[] = [];
    let cursor = '0';
    
    do {
      const result = await redis.scan(cursor, { match: `${COOLDOWN_PREFIX}*`, count: 100 });
      cursor = result[0];
      keys.push(...result[1]);
    } while (cursor !== '0');
    
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('[Cooldowns] Error clearing cooldowns:', err);
  }
}

/**
 * Format cooldown message
 */
export function formatCooldownMessage(remaining: number): string {
  if (remaining < 60) {
    return `⏱️ Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before using this command again.`;
  }
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `⏱️ Please wait ${minutes}m ${seconds}s before using this command again.`;
}
