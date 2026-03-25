'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface ApiMetric {
  name: string;
  responseTime: number | null;
  status: 'success' | 'error' | 'pending';
  lastUpdated: Date | null;
}

export interface ApiMetricsSummary {
  github: ApiMetric;
  vercel: ApiMetric;
  discord: ApiMetric;
  overall: ApiMetric;
}

export function useApiMetrics() {
  const [metrics, setMetrics] = useState<ApiMetricsSummary>({
    github: { name: 'GitHub API', responseTime: null, status: 'pending', lastUpdated: null },
    vercel: { name: 'Vercel API', responseTime: null, status: 'pending', lastUpdated: null },
    discord: { name: 'Discord API', responseTime: null, status: 'pending', lastUpdated: null },
    overall: { name: 'Overall', responseTime: null, status: 'pending', lastUpdated: null },
  });

  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const measureResponseTime = useCallback(async (url: string, name: string): Promise<ApiMetric> => {
    const startTime = performance.now();
    try {
      const response = await fetch(url, { method: 'GET' });
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      return {
        name,
        responseTime,
        status: response.ok ? 'success' : 'error',
        lastUpdated: new Date(),
      };
    } catch (err) {
      return {
        name,
        responseTime: null,
        status: 'error',
        lastUpdated: new Date(),
      };
    }
  }, []);

  const fetchAllMetrics = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const [github, vercel, discord] = await Promise.all([
        measureResponseTime('/api/github/repos', 'GitHub API'),
        measureResponseTime('/api/vercel/deployments', 'Vercel API'),
        measureResponseTime('/api/discord/interactions', 'Discord API'),
      ]);

      const overallTime = [github.responseTime, vercel.responseTime, discord.responseTime]
        .filter((t): t is number => t !== null)
        .reduce((sum, t) => sum + t, 0);

      const overall: ApiMetric = {
        name: 'Overall',
        responseTime: overallTime > 0 ? overallTime : null,
        status: github.status === 'success' && vercel.status === 'success' && discord.status === 'success' ? 'success' : 'error',
        lastUpdated: new Date(),
      };

      setMetrics({ github, vercel, discord, overall });
    } catch (err) {
      console.error('Failed to fetch API metrics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [measureResponseTime]);

  useEffect(() => {
    fetchAllMetrics();
    
    intervalRef.current = setInterval(fetchAllMetrics, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAllMetrics]);

  return { metrics, isLoading, refetch: fetchAllMetrics };
}

export function formatResponseTime(ms: number | null): string {
  if (ms === null) return '--';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function getResponseTimeColor(ms: number | null): string {
  if (ms === null) return '#A1A1AA';
  if (ms < 200) return '#22c55e';
  if (ms < 500) return '#f59e0b';
  return '#ef4444';
}