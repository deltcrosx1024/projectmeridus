'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSettings, DEFAULT_SETTINGS } from '@/app/lib/settings';

interface UseSettingsReturn {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, use defaults
          setSettings(DEFAULT_SETTINGS);
          return;
        }
        throw new Error('Failed to fetch settings');
      }
      
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      console.error('[useSettings] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Fall back to defaults
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    try {
      setError(null);
      
      // Optimistic update
      setSettings(prev => ({ ...prev, ...newSettings }));
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save settings');
      }
      
      const savedSettings = await response.json();
      setSettings(savedSettings);
    } catch (err) {
      console.error('[useSettings] Update error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      // Revert on error by refetching
      await fetchSettings();
      throw err;
    }
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: fetchSettings,
  };
}
