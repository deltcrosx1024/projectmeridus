// lib/discord/userPreferences.ts
// User preferences for Discord bot features

import { redis } from '../redis';

export interface UserPreferences {
  discordUserId: string;
  dmNotifications: boolean;
  dmEventTypes: string[];
  digestMode: 'instant' | 'hourly' | 'daily';
  digestTime?: string; // HH:MM format
  timezone?: string;
  mutedRepos: string[];
  customFilters: NotificationFilter[];
  silentMode?: {
    enabled: boolean;
    until: string; // ISO date
    reason?: string;
  };
  githubUsername?: string;
}

export interface NotificationFilter {
  id: string;
  repo: string;
  include: string[];
  exclude: string[];
}

const PREFS_PREFIX = 'meridus:prefs:';
const TTL_SECONDS = 60 * 60 * 24 * 365; // 1 year

/**
 * Get or create user preferences
 */
export async function getUserPreferences(discordUserId: string): Promise<UserPreferences> {
  const key = `${PREFS_PREFIX}${discordUserId}`;
  const data = await redis.get<string>(key);
  
  if (data) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      return {
        discordUserId,
        dmNotifications: false,
        dmEventTypes: [],
        digestMode: 'instant',
        mutedRepos: [],
        customFilters: [],
        ...parsed,
      };
    } catch (e) {
      console.error('[UserPrefs] Failed to parse:', e);
    }
  }
  
  // Return defaults
  return {
    discordUserId,
    dmNotifications: false,
    dmEventTypes: [],
    digestMode: 'instant',
    mutedRepos: [],
    customFilters: [],
  };
}

/**
 * Save user preferences
 */
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  const key = `${PREFS_PREFIX}${prefs.discordUserId}`;
  await redis.setex(key, TTL_SECONDS, JSON.stringify(prefs));
}

/**
 * Update specific preference
 */
export async function updateUserPreference<K extends keyof UserPreferences>(
  discordUserId: string,
  key: K,
  value: UserPreferences[K]
): Promise<void> {
  const prefs = await getUserPreferences(discordUserId);
  prefs[key] = value;
  await saveUserPreferences(prefs);
}

/**
 * Toggle DM notifications
 */
export async function toggleDMNotifications(
  discordUserId: string,
  enabled: boolean
): Promise<boolean> {
  await updateUserPreference(discordUserId, 'dmNotifications', enabled);
  return enabled;
}

/**
 * Set DM event types
 */
export async function setDMEventTypes(
  discordUserId: string,
  events: string[]
): Promise<void> {
  await updateUserPreference(discordUserId, 'dmEventTypes', events);
}

/**
 * Set digest mode
 */
export async function setDigestMode(
  discordUserId: string,
  mode: 'instant' | 'hourly' | 'daily',
  time?: string
): Promise<void> {
  const prefs = await getUserPreferences(discordUserId);
  prefs.digestMode = mode;
  if (time) prefs.digestTime = time;
  await saveUserPreferences(prefs);
}

/**
 * Toggle silent mode
 */
export async function setSilentMode(
  discordUserId: string,
  enabled: boolean,
  durationMinutes?: number,
  reason?: string
): Promise<void> {
  const prefs = await getUserPreferences(discordUserId);
  
  if (enabled) {
    const until = new Date();
    until.setMinutes(until.getMinutes() + (durationMinutes || 60));
    
    prefs.silentMode = {
      enabled: true,
      until: until.toISOString(),
      reason,
    };
  } else {
    prefs.silentMode = { enabled: false, until: new Date().toISOString() };
  }
  
  await saveUserPreferences(prefs);
}

/**
 * Check if user is in silent mode
 */
export async function isInSilentMode(discordUserId: string): Promise<boolean> {
  const prefs = await getUserPreferences(discordUserId);
  
  if (!prefs.silentMode?.enabled) return false;
  
  const until = new Date(prefs.silentMode.until);
  if (new Date() > until) {
    // Auto-disable expired silent mode
    await setSilentMode(discordUserId, false);
    return false;
  }
  
  return true;
}

/**
 * Mute a repository
 */
export async function muteRepository(
  discordUserId: string,
  repo: string
): Promise<void> {
  const prefs = await getUserPreferences(discordUserId);
  if (!prefs.mutedRepos.includes(repo.toLowerCase())) {
    prefs.mutedRepos.push(repo.toLowerCase());
    await saveUserPreferences(prefs);
  }
}

/**
 * Unmute a repository
 */
export async function unmuteRepository(
  discordUserId: string,
  repo: string
): Promise<void> {
  const prefs = await getUserPreferences(discordUserId);
  prefs.mutedRepos = prefs.mutedRepos.filter(
    r => r !== repo.toLowerCase()
  );
  await saveUserPreferences(prefs);
}

/**
 * Add custom notification filter
 */
export async function addNotificationFilter(
  discordUserId: string,
  filter: Omit<NotificationFilter, 'id'>
): Promise<NotificationFilter> {
  const prefs = await getUserPreferences(discordUserId);
  const newFilter: NotificationFilter = {
    ...filter,
    id: Math.random().toString(36).substring(2, 9),
  };
  prefs.customFilters.push(newFilter);
  await saveUserPreferences(prefs);
  return newFilter;
}

/**
 * Remove notification filter
 */
export async function removeNotificationFilter(
  discordUserId: string,
  filterId: string
): Promise<boolean> {
  const prefs = await getUserPreferences(discordUserId);
  const initialLength = prefs.customFilters.length;
  prefs.customFilters = prefs.customFilters.filter(f => f.id !== filterId);
  await saveUserPreferences(prefs);
  return prefs.customFilters.length < initialLength;
}

/**
 * Set GitHub username mapping
 */
export async function setGitHubUsername(
  discordUserId: string,
  githubUsername: string
): Promise<void> {
  await updateUserPreference(discordUserId, 'githubUsername', githubUsername);
}
