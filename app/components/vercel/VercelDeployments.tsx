'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

interface Deployment {
  uid: string;
  name: string;
  state: string;
  created: number;
  ready: string;
  branch: string;
  commit: string;
  commitSha: string;
  creator: string;
  alias?: string[];
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getStateColor(state: string): { bg: string; text: string; label: string } {
  switch (state) {
    case 'READY':
      return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ready' };
    case 'BUILDING':
      return { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Building' };
    case 'ERROR':
      return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Error' };
    case 'CANCELED':
      return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Canceled' };
    case 'QUEUED':
      return { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Queued' };
    default:
      return { bg: 'bg-gray-500/20', text: 'text-gray-400', label: state };
  }
}

function getStateIcon(state: string) {
  switch (state) {
    case 'READY':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'BUILDING':
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    case 'ERROR':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export default function VercelDeployments() {
  const { vercelUser, logout } = useAuth();
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchDeployments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/vercel/deployments?limit=20', {
        credentials: 'include',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (data.needsAuth || data.needsReauth || res.status === 401) {
          setNeedsReauth(true);
          setError(data.error || 'Please reconnect your Vercel account');
        } else {
          setError(data.error || `Failed to fetch deployments (${res.status})`);
        }
        setDeployments([]);
        return;
      }
      
      if (!Array.isArray(data) || data.length === 0) {
        setError(null);
        setDeployments([]);
      } else {
        setDeployments(data);
        setError(null);
        setNeedsReauth(false);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error('[VercelDeployments] Fetch error:', err);
      setError('Failed to connect to Vercel API');
      setDeployments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (vercelUser) {
      fetchDeployments();
      const interval = setInterval(fetchDeployments, 30000);
      return () => clearInterval(interval);
    }
  }, [vercelUser, fetchDeployments]);

  if (!vercelUser) return null;

  const readyCount = deployments.filter(d => d.state === 'READY').length;
  const buildingCount = deployments.filter(d => d.state === 'BUILDING').length;
  const errorCount = deployments.filter(d => d.state === 'ERROR').length;

  return (
    <section className="py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <svg className="w-5 h-5 text-black" viewBox="0 0 76 76" fill="currentColor">
                <path d="M38.001 0L0 38.001l38.001 37.999 38-37.999L38.001 0zM38.002 27.587l19.045 19.043-19.045 19.046-19.045-19.046 19.045-19.043zM28.883 28.883L9.747 47.993l-6.04-6.035 19.137-19.075 6.039 6.04z" />
              </svg>
            </div>
            <div>
              <h2 
                className="text-xl font-bold text-[var(--foreground)]" 
                style={{ fontFamily: 'var(--font-aldrich)' }}
              >
                Vercel Deployments
              </h2>
              <p className="text-[var(--muted)] text-sm">
                {vercelUser.username ? `@${vercelUser.username}'s deployments` : 'Live deployment status'}
                {lastUpdated && (
                  <span className="ml-2 text-xs text-[var(--muted)]">
                    • Updated {formatTimeAgo(lastUpdated.getTime())}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badges */}
            <div className="flex items-center gap-2">
              {readyCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                  {readyCount} Ready
                </span>
              )}
              {buildingCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                  <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {buildingCount} Building
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs">
                  <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                  {errorCount} Error
                </span>
              )}
            </div>

            <button
              onClick={fetchDeployments}
              disabled={isLoading}
              className="p-2 bg-[var(--card-bg)] hover:bg-[var(--card-border)]/10 text-[var(--foreground)] rounded-lg transition-colors"
              title="Refresh"
            >
              <svg 
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-400 text-sm">{error}</p>
              <button
                onClick={() => {
                  logout('vercel');
                }}
                className="ml-4 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
              >
                Reconnect
              </button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {isLoading && deployments.length === 0 && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#0070F3] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--muted)]">Loading deployments...</p>
          </div>
        )}

        {/* Deployments list */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {deployments.length === 0 ? (
              <div className="text-center py-12 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
                <svg className="w-12 h-12 mx-auto mb-4 text-[var(--muted)]" viewBox="0 0 76 76" fill="currentColor">
                  <path d="M38.001 0L0 38.001l38.001 37.999 38-37.999L38.001 0zM38.002 27.587l19.045 19.043-19.045 19.046-19.045-19.046 19.045-19.043zM28.883 28.883L9.747 47.993l-6.04-6.035 19.137-19.075 6.039 6.04z" />
                </svg>
                <p className="text-[var(--muted)] mb-2">No deployments found</p>
                <p className="text-[var(--muted)] text-sm">Connect a Vercel project to see deployments here</p>
              </div>
            ) : (
              deployments.map((deployment) => {
                const stateStyle = getStateColor(deployment.state);
                
                return (
                  <div
                    key={deployment.uid}
                    className="flex items-center gap-4 p-4 bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--card-border)]/70 rounded-lg transition-all group"
                  >
                    {/* State indicator */}
                    <div className={`w-10 h-10 rounded-lg ${stateStyle.bg} ${stateStyle.text} flex items-center justify-center flex-shrink-0`}>
                      {getStateIcon(deployment.state)}
                    </div>

                    {/* Deployment info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-[var(--foreground)]">{deployment.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${stateStyle.bg} ${stateStyle.text}`}>
                          {stateStyle.label}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-[var(--muted)] mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          {deployment.branch}
                        </span>
                        {deployment.commitSha && (
                          <span className="font-mono text-[#0070F3]">
                            {deployment.commitSha.substring(0, 7)}
                          </span>
                        )}
                        {deployment.commit && (
                          <span className="truncate max-w-[200px]">
                            {deployment.commit.split('\n')[0]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-[var(--muted)]">
                        {formatTimeAgo(deployment.created)}
                      </span>
                      {deployment.alias && deployment.alias[0] && (
                        <a
                          href={`https://${deployment.alias[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs text-[#0070F3] hover:underline mt-1"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </section>
  );
}
