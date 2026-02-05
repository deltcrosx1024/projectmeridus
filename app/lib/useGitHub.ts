'use client';

import { useEffect, useState } from 'react';

interface GitHubRepo {
  id: number;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
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

export function useGitHubRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch('/api/github/repos');
        const data = await response.json();
        if (!response.ok) {
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
        }));
        
        setRepos(formatted.slice(0, 6)); // Limit to 6 repos
      } catch (err: any) {
        console.error('useGitHubRepos error', err);
        setError(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return { repos, isLoading, error };
}

export function useGitHubIssues() {
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch('/api/github/issues');
        const data = await response.json();
        if (!response.ok) {
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
        
        setIssues(formatted.slice(0, 6)); // Limit to 6 issues
      } catch (err: any) {
        console.error('useGitHubIssues error', err);
        setError(err.message || String(err));
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, []);

  return { issues, isLoading, error };
}

export function useGitHubPullRequests() {
  const [prs, setPrs] = useState<GitHubPullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPullRequests = async () => {
      try {
        const response = await fetch('/api/github/issues?type=pull');
        const data = await response.json();
        if (!response.ok) {
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
        
        setPrs(formatted.slice(0, 6)); // Limit to 6 PRs
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPullRequests();
  }, []);

  return { prs, isLoading, error };
}
