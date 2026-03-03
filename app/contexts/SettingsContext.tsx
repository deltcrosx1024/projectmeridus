'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { UserSettings } from '@/app/lib/settings';
import { useSettings } from '@/app/lib/useSettings';

interface SettingsContextType {
  settings: UserSettings;
  isLoading: boolean;
  error: string | null;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  refetch: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { settings, isLoading, error, updateSettings, refetch } = useSettings();

  return (
    <SettingsContext.Provider value={{ settings, isLoading, error, updateSettings, refetch }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettingsContext must be used within SettingsProvider');
  }
  return context;
}
