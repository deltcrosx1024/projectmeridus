'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSettingsContext } from './SettingsContext'; // settings provider for saved theme preference

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { settings, updateSettings } = useSettingsContext();
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('dark'); // current theme after system resolution

  const theme = settings.theme || 'dark'; // selected theme preference

  useEffect(() => {
    const root = document.documentElement;
    
    let newTheme: 'dark' | 'light';
    if (theme === 'system') {
      newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newTheme = theme;
    }
    
    setResolvedTheme(newTheme); // update theme state used by components
    
    // Set data-theme attribute instead of adding/removing classes
    root.setAttribute('data-theme', newTheme); // root attribute used for global theme styling
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = async (newTheme: Theme) => {
    await updateSettings({ theme: newTheme }); // persist theme preference
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme); // toggle between dark and light
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
