'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
}

interface GitHubIssue {
  id: number;
  title: string;
  number: number;
  state: string;
  url: string;
  created_at: string;
}

interface GitHubPullRequest {
  id: number;
  title: string;
  number: number;
  state: string;
  url: string;
  created_at: string;
}

interface GitHubCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repo_name: string;
  repo_owner: string;
  avatar_url: string;
}

export function useGitHubRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettingsContext();
  const { autoRefresh = true, refreshInterval = 5 } = settings;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchRepos = useCallback(async () => {
    try {
      const response = await fetch('/api/github/repos');
      const data = await response.json();
      if (!response.ok) {
        if (data?.needsAuth) {
          setRepos([]);
          setIsLoading(false);
          return;
        }
        const errMsg = data?.error || data?.message || 'Failed to fetch repos';
        throw new Error(errMsg);
      }
      
      const formatted = data.map((repo: any) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description || 'No description',
        url: repo.html_url,
        language: repo.language || 'Unknown',
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updated_at: repo.updated_at || repo.pushed_at || new Date().toISOString(),
      }));
      
      setRepos(formatted.slice(0, 6));
      setError(null);
    } catch (err: any) {
      console.error('useGitHubRepos error', err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepos();

    if (autoRefresh && refreshInterval > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      intervalRef.current = setInterval(fetchRepos, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchRepos, autoRefresh, refreshInterval]);

  return { repos, isLoading, error, refetch: fetchRepos };
}

export function useGitHubIssues() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettingsContext();
  const { autoRefresh = true, refreshInterval = 5 } = settings;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchIssues = useCallback(async () => {
    try {
      const response = await fetch('/api/github/issues');
      const data = await response.json();
      if (!response.ok) {
        if (data?.needsAuth) {
          setIssues([]);
          setIsLoading(false);
          return;
        }
        const errMsg = data?.error || data?.message || 'Failed to fetch issues';
        throw new Error(errMsg);
      }
      
      const formatted = data.map((issue: any) => ({
        id: issue.id,
        title: issue.title,
        number: issue.number,
        state: issue.state,
        url: issue.html_url,
        created_at: issue.created_at,
      }));
      
      setIssues(formatted.slice(0, 6));
      setError(null);
    } catch (err: any) {
      console.error('useGitHubIssues error', err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();

    if (autoRefresh && refreshInterval > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      intervalRef.current = setInterval(fetchIssues, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchIssues, autoRefresh, refreshInterval]);

  return { issues, isLoading, error, refetch: fetchIssues };
}

export function useGitHubPullRequests() {
  const [prs, setPrs] = useState<GitHubPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettingsContext();
  const { autoRefresh = true, refreshInterval = 5 } = settings;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPullRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/github/issues?type=pull');
      const data = await response.json();
      if (!response.ok) {
        if (data?.needsAuth) {
          setPrs([]);
          setIsLoading(false);
          return;
        }
        const errMsg = data?.error || data?.message || 'Failed to fetch pull requests';
        throw new Error(errMsg);
      }
      
      const formatted = data.map((pr: any) => ({
        id: pr.id,
        title: pr.title,
        number: pr.number,
        state: pr.state,
        url: pr.html_url,
        created_at: pr.created_at,
      }));
      
      setPrs(formatted.slice(0, 6));
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPullRequests();

    if (autoRefresh && refreshInterval > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      intervalRef.current = setInterval(fetchPullRequests, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPullRequests, autoRefresh, refreshInterval]);

  return { prs, isLoading, error, refetch: fetchPullRequests };
}

export function useGitHubCommits(perRepo = 5, maxRepos = 10) {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { settings } = useSettingsContext();
  const { autoRefresh = true, refreshInterval = 5 } = settings;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCommits = useCallback(async () => {
    try {
      const response = await fetch(`/api/github/commits?per_repo=${perRepo}&max_repos=${maxRepos}`);
      const data = await response.json();
      if (!response.ok) {
        if (data?.needsAuth) {
          setCommits([]);
          setIsLoading(false);
          return;
        }
        const errMsg = data?.error || data?.message || 'Failed to fetch commits';
        throw new Error(errMsg);
      }
      
      setCommits(data);
      setError(null);
    } catch (err: any) {
      console.error('useGitHubCommits error', err);
      setError(err.message || String(err));
    } finally {
      setIsLoading(false);
    }
  }, [perRepo, maxRepos]);

  useEffect(() => {
    fetchCommits();

    if (autoRefresh && refreshInterval > 0) {
      const intervalMs = refreshInterval * 60 * 1000;
      intervalRef.current = setInterval(fetchCommits, intervalMs);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchCommits, autoRefresh, refreshInterval]);

  return { commits, isLoading, error, refetch: fetchCommits };
}
