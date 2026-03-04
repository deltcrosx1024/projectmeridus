// lib/settings.ts
// User settings management with Redis storage

import { redis } from './redis';

const SETTINGS_PREFIX = 'settings:';
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export interface UserSettings {
  // Notifications
  webhookNotifications: boolean;
  issueAlerts: boolean;
  commitNotifications: boolean;

  // Repository preferences
  defaultView: 'grid' | 'list' | 'compact';
  autoRefresh: boolean;
  refreshInterval: number; // in minutes
  pinnedRepos: number[]; // Array of repo IDs

  // Appearance
  compactMode: boolean;
  theme: 'dark' | 'light' | 'system';
}

export const DEFAULT_SETTINGS: UserSettings = {
  webhookNotifications: true,
  issueAlerts: true,
  commitNotifications: false,
  defaultView: 'grid',
  autoRefresh: true,
  refreshInterval: 5,
  pinnedRepos: [],
  compactMode: false,
  theme: 'dark',
};

function getSettingsKey(userId: string): string {
  return `${SETTINGS_PREFIX}${userId}`;
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    const key = getSettingsKey(userId);
    const data = await redis.get<string>(key);
    
    if (!data) {
      return DEFAULT_SETTINGS;
    }
    
    const parsed = JSON.parse(data);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('[Settings] Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveUserSettings(
  userId: string, 
  settings: Partial<UserSettings>
): Promise<UserSettings> {
  try {
    const key = getSettingsKey(userId);
    const currentSettings = await getUserSettings(userId);
    const newSettings = { ...currentSettings, ...settings };
    
    await redis.setex(key, TTL_SECONDS, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error('[Settings] Failed to save settings:', error);
    throw error;
  }
}

export async function deleteUserSettings(userId: string): Promise<void> {
  try {
    const key = getSettingsKey(userId);
    await redis.del(key);
  } catch (error) {
    console.error('[Settings] Failed to delete settings:', error);
    throw error;
  }
}
