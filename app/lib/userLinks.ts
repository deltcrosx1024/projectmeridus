// lib/userLinks.ts
// Discord User ID <-> GitHub/Vercel Token linking with Redis storage

import { redis } from './redis';
import { encryptToken, decryptToken, hashUserId } from './crypto';

export interface UserLink {
  discordUserId: string;
  discordUsername?: string;
  githubToken: string;
  githubUsername?: string;
  vercelToken?: string;
  vercelUsername?: string;
  vercelTeamId?: string;
  linkedAt: string;
  lastUsed?: string;
}

const KEY_PREFIX = 'meridus:link:';
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Shape of the data stored in Redis (tokens are encrypted) */
interface StoredUserLink {
  discordUserId: string;
  discordUsername?: string;
  githubToken: string;
  githubUsername?: string;
  vercelToken?: string;
  vercelUsername?: string;
  vercelTeamId?: string;
  linkedAt: string;
  lastUsed?: string;
}

/**
 * Upstash Redis may return an already-parsed object or a JSON string
 * depending on the client version and serialisation settings.
 * This helper normalises both cases.
 */
function parseRedisValue<T>(data: unknown): T {
  if (typeof data === 'string') {
    return JSON.parse(data) as T;
  }
  return data as T;
}

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
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
   
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
 * Link Vercel account to existing Discord-GitHub link
 * Called during OAuth callback when user adds Vercel to existing account
 */
export async function linkVercelAccount(
  discordUserId: string,
  vercelToken: string,
  metadata?: {
    vercelUsername?: string;
    vercelTeamId?: string;
  }
): Promise<void> {
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
   
  const existingData = await redis.get(key);
  if (!existingData) {
    throw new Error('No existing user link found. Please link Discord first.');
  }
   
  const encryptedToken = await encryptToken(vercelToken);
   
  const parsed = parseRedisValue<StoredUserLink>(existingData);
   
  const updatedLink = {
    ...parsed,
    vercelToken: encryptedToken,
    vercelUsername: metadata?.vercelUsername || parsed.vercelUsername,
    vercelTeamId: metadata?.vercelTeamId || parsed.vercelTeamId,
    lastUsed: new Date().toISOString(),
  };
   
  await redis.setex(key, TTL_SECONDS, JSON.stringify(updatedLink));
  console.log(`[UserLinks] Linked Vercel to Discord user ${discordUserId}`);
}

/**
 * Get a user's linked GitHub token
 * Called from Discord bot commands
 */
export async function getUserLink(discordUserId: string): Promise<UserLink | null> {
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
 
  const data = await redis.get(key);
  if (!data) {
    return null;
  }

  try {
    const parsed = parseRedisValue<StoredUserLink>(data);

    // Decrypt the GitHub token
    const decryptedToken = await decryptToken(parsed.githubToken);
    
    // Decrypt Vercel token if exists
    let decryptedVercelToken: string | undefined;
    if (parsed.vercelToken) {
      decryptedVercelToken = await decryptToken(parsed.vercelToken);
    }

    // Update last used time if older than 5 minutes to reduce Redis writes
    // We fetch fresh data to avoid overwriting concurrent updates
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const lastUsedTime = parsed.lastUsed ? new Date(parsed.lastUsed).getTime() : 0;
    
    if (lastUsedTime < fiveMinutesAgo) {
      const freshData = await redis.get(key);
      if (freshData) {
        const freshParsed = parseRedisValue<StoredUserLink>(freshData);
        const updateData = {
          ...freshParsed,
          lastUsed: new Date().toISOString(),
        };
        await redis.setex(key, TTL_SECONDS, JSON.stringify(updateData));
      }
    }

    return {
      discordUserId: parsed.discordUserId,
      discordUsername: parsed.discordUsername,
      githubToken: decryptedToken,
      githubUsername: parsed.githubUsername,
      vercelToken: decryptedVercelToken,
      vercelUsername: parsed.vercelUsername,
      vercelTeamId: parsed.vercelTeamId,
      linkedAt: parsed.linkedAt,
      lastUsed: parsed.lastUsed,
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
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
  const exists = await redis.exists(key);
  return exists === 1;
}

/**
 * Get user's Vercel token (decrypted)
 */
export async function getUserVercelToken(discordUserId: string): Promise<string | null> {
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
   
  const data = await redis.get(key);
  if (!data) {
    return null;
  }
   
  try {
    const parsed = parseRedisValue<StoredUserLink>(data);
   
    if (!parsed.vercelToken) {
      return null;
    }
   
    return await decryptToken(parsed.vercelToken);
  } catch (error) {
    console.error(`[UserLinks] Failed to get Vercel token for ${discordUserId}:`, error);
    return null;
  }
}

/**
 * Check if user has Vercel linked
 */
export async function hasLinkedVercel(discordUserId: string): Promise<boolean> {
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
   
  const data = await redis.get(key);
  if (!data) {
    return false;
  }
   
  try {
    const parsed = parseRedisValue<StoredUserLink>(data);
    return !!parsed.vercelToken;
  } catch {
    return false;
  }
}

/**
 * Unlink a Discord user from their GitHub account
 */
export async function unlinkUser(discordUserId: string): Promise<boolean> {
  const key = `${KEY_PREFIX}${hashUserId(discordUserId)}`;
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
   
  // Extract discordUserId from the stored values, not from the hashed keys
  const userIds: string[] = [];
  for (const key of keys) {
    const data = await redis.get(key);
    if (data) {
      try {
        const parsed = parseRedisValue<StoredUserLink>(data);
        userIds.push(parsed.discordUserId);
      } catch (error) {
        console.error(`[UserLinks] Failed to parse link data for key ${key}:`, error);
      }
    }
  }
   
  return userIds;
}
