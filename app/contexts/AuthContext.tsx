'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';

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

interface VercelUser {
  username: string;
  email: string;
  userId: string;
  teamId?: string;
  teamSlug?: string;
}

interface AuthContextType {
  githubUser: GitHubUser | null;
  discordUser: DiscordUser | null;
  vercelUser: VercelUser | null;
  isLoading: boolean;
  refreshAuth: () => void;
  logout: (service: 'github' | 'discord' | 'vercel') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function parseCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [discordUser, setDiscordUser] = useState<DiscordUser | null>(null);
  const [vercelUser, setVercelUser] = useState<VercelUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(false);

  const refreshAuth = useCallback(() => {
    if (!mountedRef.current) return;
    
    try {
      const ghUserCookie = parseCookie('github_user');
      const discordUserCookie = parseCookie('discord_user');
      const vercelUserCookie = parseCookie('vercel_user');

      if (ghUserCookie) {
        try {
          setGithubUser(JSON.parse(ghUserCookie));
        } catch (e) {
          console.error('Failed to parse github_user cookie:', e);
          setGithubUser(null);
        }
      } else {
        setGithubUser(null);
      }

      if (discordUserCookie) {
        try {
          setDiscordUser(JSON.parse(discordUserCookie));
        } catch (e) {
          console.error('Failed to parse discord_user cookie:', e);
          setDiscordUser(null);
        }
      } else {
        setDiscordUser(null);
      }

      if (vercelUserCookie) {
        try {
          setVercelUser(JSON.parse(vercelUserCookie));
        } catch (e) {
          console.error('Failed to parse vercel_user cookie:', e);
          setVercelUser(null);
        }
      } else {
        setVercelUser(null);
      }
    } catch (e) {
      console.error('Auth refresh failed:', e);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    const checkAuth = () => {
      try {
        const ghUserCookie = parseCookie('github_user');
        const discordUserCookie = parseCookie('discord_user');
        const vercelUserCookie = parseCookie('vercel_user');

        if (ghUserCookie) {
          try {
            setGithubUser(JSON.parse(ghUserCookie));
          } catch (e) {
            console.error('Failed to parse github_user cookie:', e);
          }
        }

        if (discordUserCookie) {
          try {
            setDiscordUser(JSON.parse(discordUserCookie));
          } catch (e) {
            console.error('Failed to parse discord_user cookie:', e);
          }
        }

        if (vercelUserCookie) {
          try {
            setVercelUser(JSON.parse(vercelUserCookie));
          } catch (e) {
            console.error('Failed to parse vercel_user cookie:', e);
          }
        }
      } catch (e) {
        console.error('Auth check failed:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    const handleFocus = () => {
      refreshAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      mountedRef.current = false;
    };
  }, [refreshAuth]);

  const logout = (service: 'github' | 'discord' | 'vercel') => {
    if (service === 'github') {
      document.cookie = 'github_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'github_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      setGithubUser(null);
    } else if (service === 'discord') {
      document.cookie = 'discord_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'discord_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      setDiscordUser(null);
    } else {
      document.cookie = 'vercel_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'vercel_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      document.cookie = 'vercel_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
      setVercelUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ githubUser, discordUser, vercelUser, isLoading, refreshAuth, logout }}>
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
