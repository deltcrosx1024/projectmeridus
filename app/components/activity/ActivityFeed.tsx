'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

interface Activity {
  id: string;
  type: 'commit' | 'issue' | 'pr' | 'release' | 'fork' | 'star';
  actor: {
    login: string;
    avatar_url: string;
  };
  repo: string;
  message: string;
  timestamp: string;
  url?: string;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getActivityIcon(type: Activity['type']) {
  switch (type) {
    case 'commit':
      return (
        <div className="w-10 h-10 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </div>
      );
    case 'issue':
      return (
        <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      );
    case 'pr':
      return (
        <div className="w-10 h-10 rounded-full bg-purple-600/20 text-purple-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      );
    case 'release':
      return (
        <div className="w-10 h-10 rounded-full bg-green-600/20 text-green-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
      );
    case 'fork':
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-600/20 text-yellow-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
        </div>
      );
    case 'star':
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-600/20 text-yellow-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      );
  }
}

export default function ActivityFeed() {
  const { githubUser } = useAuth();
  const { settings } = useSettingsContext();
  const { compactMode } = settings;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<Activity['type'] | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!githubUser) return;
    
    try {
      const res = await fetch('/api/github/events?per_page=10');
      if (!res.ok) {
        const data = await res.json();
        if (data.needsAuth) {
          setError('Please connect your GitHub account');
        } else {
          setError(data.error || 'Failed to fetch activities');
        }
        return;
      }
      const data = await res.json();
      setActivities(data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError('Failed to fetch activities');
    } finally {
      setIsLoading(false);
    }
  }, [githubUser]);

  useEffect(() => {
    if (githubUser) {
      fetchActivities();
      const interval = setInterval(fetchActivities, 30000);
      return () => clearInterval(interval);
    }
  }, [githubUser, fetchActivities]);

  if (!githubUser) return null;

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.type === filter);

  return (
    <section className={`py-8 px-4 ${compactMode ? 'py-4' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 
              className={`font-bold ${compactMode ? 'text-xl' : 'text-2xl'} text-[var(--foreground)]`} 
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Activity Feed
            </h2>
            <p className="text-[var(--muted)] text-sm mt-1">
              Recent activity across your repositories
              {lastUpdated && (
                <span className="ml-2 text-xs text-[var(--muted)]">
                  • Updated {formatTimeAgo(lastUpdated.toISOString())}
                </span>
              )}
            </p>
          </div>

          {/* Refresh button */}
          <button
            onClick={fetchActivities}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[var(--card-bg)] hover:bg-[var(--card-border)]/10 text-[var(--foreground)] rounded-lg transition-colors text-sm flex items-center gap-2"
          >
            <svg 
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'commit', 'issue', 'pr', 'release'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === type 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-[var(--card-bg)] text-[var(--muted)] hover:bg-[var(--card-border)]/20 hover:text-[var(--foreground)]'
              }`}
            >
              {type === 'all' ? 'All' : type}
            </button>
          ))}
        </div>

         {/* Error message */}

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && activities.length === 0 && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[var(--muted)]">Loading activities...</p>
          </div>
        )}

        {/* Timeline */}
        {!isLoading && !error && (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[var(--card-border)] hidden sm:block" />

            <div className="space-y-4">
              {filteredActivities.map((activity) => (
                <div 
                  key={activity.id}
                  className="relative flex items-start gap-4 group"
                >
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4 hover:bg-[var(--card-border)]/10 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={activity.actor.avatar_url}
                          alt={activity.actor.login}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-medium text-[var(--foreground)]">{activity.actor.login}</span>
                        <span className="text-[var(--muted)]">in</span>
                        <span className="text-blue-400">{activity.repo}</span>
                      </div>
                      <span className="text-xs text-[var(--muted)] flex-shrink-0">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                    
                    <p className="mt-2 text-[var(--foreground)]">
                      {activity.message}
                    </p>

                    {/* Action buttons */}
                    <div className="mt-3 flex gap-2">
                      <button className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                        View details
                      </button>
                      <span className="text-[var(--muted)]">•</span>
                      <button className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                        {activity.repo}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredActivities.length === 0 && (
              <div className="text-center py-12 text-[var(--muted)]">
                <p>No activities found</p>
              </div>
            )}
          </div>
        )}

        {/* Load more */}
        {!isLoading && filteredActivities.length > 0 && (
          <div className="mt-6 text-center">
            <button 
              onClick={fetchActivities}
              className="px-4 py-2 bg-[var(--card-bg)] hover:bg-[var(--card-border)]/10 text-[var(--foreground)] rounded-lg transition-colors text-sm"
            >
              Load more activity
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
