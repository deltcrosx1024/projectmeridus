'use client';

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
}

interface AuthContextType {
  githubUser: GitHubUser | null;
  discordUser: DiscordUser | null;
  isLoading: boolean;
  logout: (service: 'github' | 'discord') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    const checkAuth = () => {
      try {
        const ghUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('github_user='))
          ?.split('=')[1];
        
        const discordUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('discord_user='))
          ?.split('=')[1];

        if (ghUserCookie) {
          try {
            setGithubUser(JSON.parse(decodeURIComponent(ghUserCookie)));
          } catch (e) {
            console.error('Failed to parse github_user cookie:', e);
          }
        }

        if (discordUserCookie) {
          try {
            setDiscordUser(JSON.parse(decodeURIComponent(discordUserCookie)));
          } catch (e) {
            console.error('Failed to parse discord_user cookie:', e);
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      }
    };

    checkAuth();
  }, []);

  const logout = (service: 'github' | 'discord') => {
    if (service === 'github') {
      document.cookie = 'github_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'github_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      setGithubUser(null);
    } else {
      document.cookie = 'discord_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'discord_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      setDiscordUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ githubUser, discordUser, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
