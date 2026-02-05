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

export function useGitHubRepos() {
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch('/api/github/repos');
        if (!response.ok) throw new Error('Failed to fetch repos');
        const data = await response.json();
        
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
        setError(err.message);
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
        if (!response.ok) throw new Error('Failed to fetch issues');
        const data = await response.json();
        
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
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
  }, []);

  return { issues, isLoading, error };
}
