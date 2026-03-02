// lib/userLinks.ts
// Discord User ID <-> GitHub Token linking with Redis storage

import { redis } from './redis';
import { encryptToken, decryptToken, hashUserId } from './crypto';

export interface UserLink {
  discordUserId: string;
  discordUsername?: string;
  githubToken: string;
  githubUsername?: string;
  linkedAt: string;
  lastUsed?: string;
}

const KEY_PREFIX = 'meridus:link:';
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/**
 * Link a Discord user to their GitHub token
 * Called during OAuth callback when both services are authenticated
 */
export async function linkUser(
  discordUserId: string,
  githubToken: string,
  metadata?: {
    discordUsername?: string;
    githubUsername?: string;
  }
): Promise<void> {
  const key = `${KEY_PREFIX}${discordUserId}`;
  
  // Encrypt the GitHub token before storing
  const encryptedToken = await encryptToken(githubToken);
  
  const link: Omit<UserLink, 'githubToken'> & { githubToken: string } = {
    discordUserId,
    discordUsername: metadata?.discordUsername,
    githubUsername: metadata?.githubUsername,
    githubToken: encryptedToken,
    linkedAt: new Date().toISOString(),
  };
  
  const jsonString = JSON.stringify(link);
  console.log(`[UserLinks] Storing data:`, jsonString.substring(0, 100) + '...');
  await redis.setex(key, TTL_SECONDS, jsonString);
  console.log(`[UserLinks] Linked Discord user ${discordUserId} to GitHub`);
}

/**
 * Get a user's linked GitHub token
 * Called from Discord bot commands
 */
export async function getUserLink(discordUserId: string): Promise<UserLink | null> {
  const key = `${KEY_PREFIX}${discordUserId}`;

  const data = await redis.get<string>(key);
  if (!data) {
    return null;
  }

  try {
    // Handle both string and already-parsed object
    let parsed: Omit<UserLink, 'githubToken'> & { githubToken: string };

    if (typeof data === 'string') {
      parsed = JSON.parse(data);
    } else if (typeof data === 'object') {
      parsed = data as any;
    } else {
      throw new Error(`Unexpected data type: ${typeof data}`);
    }

    // Decrypt the GitHub token
    const decryptedToken = await decryptToken(parsed.githubToken);

    // Update last used time
    await redis.setex(key, TTL_SECONDS, JSON.stringify({
      ...parsed,
      lastUsed: new Date().toISOString(),
    }));

    return {
      ...parsed,
      githubToken: decryptedToken,
    };
  } catch (error) {
    console.error(`[UserLinks] Failed to parse link for ${discordUserId}:`, error);
    console.error(`[UserLinks] Raw data:`, data);
    return null;
  }
}

/**
 * Check if a user has a linked GitHub account
 */
export async function hasLinkedGitHub(discordUserId: string): Promise<boolean> {
  const key = `${KEY_PREFIX}${discordUserId}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Unlink a Discord user from their GitHub account
 */
export async function unlinkUser(discordUserId: string): Promise<boolean> {
  const key = `${KEY_PREFIX}${discordUserId}`;
  const result = await redis.del(key);
  return result === 1;
}

/**
 * Get all linked users (for admin purposes)
 * Note: This scans all keys, use carefully in production
 */
export async function getAllLinkedUsers(): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  
  do {
    const result = await redis.scan(cursor, { match: `${KEY_PREFIX}*`, count: 100 });
    cursor = result[0];
    keys.push(...result[1]);
  } while (cursor !== '0');
  
  return keys.map(k => k.replace(KEY_PREFIX, ''));
}
