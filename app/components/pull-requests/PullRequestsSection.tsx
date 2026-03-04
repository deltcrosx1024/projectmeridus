'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

interface PullRequest {
  id: number;
  title: string;
  number: number;
  state: string;
  url: string;
  created_at: string;
  user: {
    login: string;
    avatar_url: string;
  };
  repository: string;
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
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function PullRequestsSection() {
  const { githubUser } = useAuth();
  const { settings } = useSettingsContext();
  const { compactMode } = settings;
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');

  useEffect(() => {
    const fetchPRs = async () => {
      try {
        const response = await fetch('/api/github/issues?type=pull');
        if (!response.ok) throw new Error('Failed to fetch PRs');
        const data = await response.json();
        setPrs(data || []);
      } catch (err) {
        console.error('Error fetching PRs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (githubUser) fetchPRs();
  }, [githubUser]);

  if (!githubUser) return null;

  if (isLoading) {
    return (
      <section className={`py-8 px-4 ${compactMode ? 'py-4' : ''}`}>
        <div className="max-w-7xl mx-auto">
          <h2 className={`font-bold ${compactMode ? 'text-xl' : 'text-2xl'} mb-4`} style={{ fontFamily: 'var(--font-aldrich)' }}>
            Pull Requests
          </h2>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-800 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const filteredPRs = prs.filter(pr => filter === 'all' || pr.state === filter);
  const openCount = prs.filter(pr => pr.state === 'open').length;
  const closedCount = prs.filter(pr => pr.state === 'closed').length;

  return (
    <section className={`py-8 px-4 ${compactMode ? 'py-4' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 
            className={`font-bold ${compactMode ? 'text-xl' : 'text-2xl'}`} 
            style={{ fontFamily: 'var(--font-aldrich)' }}
          >
            Pull Requests
          </h2>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'open' 
                  ? 'bg-green-600/20 text-green-400 border border-green-600/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Open ({openCount})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'closed' 
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Closed ({closedCount})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-600/50' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All ({prs.length})
            </button>
          </div>
        </div>

        {filteredPRs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No {filter !== 'all' ? filter : ''} pull requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPRs.slice(0, 5).map((pr) => (
              <a
                key={pr.id}
                href={pr.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-4 p-4 bg-slate-800/80 border border-slate-700 rounded-lg hover:bg-slate-700/80 transition-all group ${compactMode ? 'p-3' : ''}`}
              >
                {/* PR Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  pr.state === 'open' ? 'bg-green-600/20 text-green-400' : 'bg-purple-600/20 text-purple-400'
                }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 
                      className={`font-semibold text-white group-hover:text-blue-400 transition-colors truncate ${compactMode ? 'text-sm' : 'text-base'}`}
                      style={{ fontFamily: 'var(--font-aldrich)' }}
                    >
                      {pr.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      pr.state === 'open' 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-purple-600/20 text-purple-400'
                    }`}>
                      {pr.state}
                    </span>
                  </div>
                  <p className={`text-slate-400 ${compactMode ? 'text-xs' : 'text-sm'}`}>
                    <span className="font-medium text-slate-300">{pr.repository}</span>
                    {' '}#{pr.number} opened {formatTimeAgo(pr.created_at)} by {pr.user?.login || 'unknown'}
                  </p>
                </div>

                {/* User Avatar */}
                {pr.user?.avatar_url && (
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    className={`rounded-full ${compactMode ? 'w-6 h-6' : 'w-8 h-8'}`}
                  />
                )}
              </a>
            ))}
            
            {filteredPRs.length > 5 && (
              <div className="text-center">
                <a 
                  href="https://github.com/pulls" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View all {filteredPRs.length} pull requests →
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
