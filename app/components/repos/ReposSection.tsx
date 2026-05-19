'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGitHubRepos } from '@/app/lib/useGitHub';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

interface Repo {
  id: number;
  name: string;
  description: string;
  url: string;
  language: string;
  stars: number;
  forks: number;
  updated_at: string;
  pushed_at?: string;
}

function formatLastUpdated(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard.writeText(text);
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `${label} copied!`, type: 'success' } }));
}

export default function ReposSection() {
  const { repos, isLoading, error } = useGitHubRepos();
  const { githubUser } = useAuth();
  const { settings, updateSettings } = useSettingsContext();
  const { compactMode, defaultView, pinnedRepos = [] } = settings;

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'stars' | 'forks' | 'name'>('updated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [hoveredRepo, setHoveredRepo] = useState<number | null>(null);

  // Focus search on / key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && e.target instanceof HTMLInputElement === false) {
        e.preventDefault();
        document.getElementById('repo-search')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('focus-search', () => document.getElementById('repo-search')?.focus());
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('focus-search', () => {});
    };
  }, []);

  // Toggle pin status
  const togglePin = async (repoId: number) => {
    const newPinned = pinnedRepos.includes(repoId)
      ? pinnedRepos.filter(id => id !== repoId)
      : [...pinnedRepos, repoId];
    
    await updateSettings({ pinnedRepos: newPinned });
    window.dispatchEvent(new CustomEvent('show-toast', { 
      detail: { 
        message: pinnedRepos.includes(repoId) ? 'Repository unpinned' : 'Repository pinned', 
        type: 'success' 
      } 
    }));
  };

  // Get unique languages
  const languages = useMemo(() => {
    const langs = new Set<string>();
    repos.forEach(repo => repo.language && langs.add(repo.language));
    return Array.from(langs).sort();
  }, [repos]);

  // Filter and sort repos
  const sortedAndFilteredRepos = useMemo(() => {
    let result = [...repos];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(repo => 
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query))
      );
    }

    // Language filter
    if (selectedLanguage !== 'all') {
      result = result.filter(repo => repo.language === selectedLanguage);
    }

    // Sort
    result.sort((a, b) => {
      // Pinned repos always first
      const aPinned = pinnedRepos.includes(a.id);
      const bPinned = pinnedRepos.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      let comparison = 0;
      switch (sortBy) {
        case 'updated':
          comparison = new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
          break;
        case 'stars':
          comparison = b.stars - a.stars;
          break;
        case 'forks':
          comparison = b.forks - a.forks;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      return sortOrder === 'asc' ? -comparison : comparison;
    });

    return result;
  }, [repos, searchQuery, selectedLanguage, sortBy, sortOrder, pinnedRepos]);

  // Separate pinned and unpinned
  const pinnedRepositories = sortedAndFilteredRepos.filter(repo => pinnedRepos.includes(repo.id));
  const unpinnedRepositories = sortedAndFilteredRepos.filter(repo => !pinnedRepos.includes(repo.id));

  if (!githubUser) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[var(--muted)]">Connect GitHub to see your repositories</p>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-aldrich)' }}>
            Loading Repositories...
          </h2>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-red-400">Error loading repositories: {error}</p>
        </div>
      </section>
    );
  }

  // Determine grid columns based on view preference
  const getGridClasses = () => {
    if (defaultView === 'list') return 'grid-cols-1';
    if (defaultView === 'compact') return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
  };

  const getGapClass = () => compactMode ? 'gap-3' : 'gap-6';
  const getCardPadding = () => compactMode ? 'p-4' : 'p-6';

  const RepoCard = ({ repo, isPinned }: { repo: Repo; isPinned: boolean }) => (
    <div
      className={`group relative ${getCardPadding()} bg-[var(--card-bg)]/80 border ${isPinned ? 'border-yellow-500/50' : 'border-[var(--card-border)]'} rounded-lg hover:bg-[var(--card-border)]/80 transition-all hover:shadow-lg ${compactMode ? 'text-sm' : ''}`}
      onMouseEnter={() => setHoveredRepo(repo.id)}
      onMouseLeave={() => setHoveredRepo(null)}
    >
      {/* Pin indicator */}
      {isPinned && (
        <div className="absolute -top-2 -left-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
          <svg className="w-3 h-3 text-[var(--card-border)]" fill="currentColor" viewBox="0 0 20 20">
            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
          </svg>
        </div>
      )}

      {/* Quick Actions Overlay */}
      {hoveredRepo === repo.id && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); togglePin(repo.id); }}
            className={`p-1.5 rounded ${isPinned ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-[var(--card-border)] hover:bg-[var(--card-border)]/80 text-[var(--foreground)] hover:text-[var(--foreground)]'}`}
            title={isPinned ? 'Unpin repository' : 'Pin repository'}
          >
            <svg className="w-4 h-4" fill={isPinned ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); copyToClipboard(repo.url, 'URL'); }}
            className="p-1.5 bg-[var(--card-border)] hover:bg-[var(--card-border)]/80 rounded text-[var(--foreground)] hover:text-[var(--foreground)]"
            title="Copy URL"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); copyToClipboard(`git clone ${repo.url}.git`, 'Clone command'); }}
            className="p-1.5 bg-[var(--card-border)] hover:bg-[var(--card-border)]/80 rounded text-[var(--foreground)] hover:text-[var(--foreground)]"
            title="Copy clone command"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
          <a
            href={repo.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 bg-[var(--card-border)] hover:bg-blue-600 rounded text-[var(--foreground)] hover:text-white"
            title="Open in GitHub"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      )}

      <a href={repo.url} target="_blank" rel="noopener noreferrer">
          <h3 
          className={`font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--accent)] transition-colors ${compactMode ? 'text-base' : 'text-lg'}`}
          style={{ fontFamily: 'var(--font-aldrich)' }}
        >
          {repo.name}
        </h3>
        <p className={`text-[var(--muted)] mb-4 ${compactMode ? 'text-xs mb-2 line-clamp-2' : 'text-sm'}`} style={{ fontFamily: 'var(--font-archivo)' }}>
          {repo.description || 'No description'}
        </p>
      </a>

      <div className={`flex items-center justify-between border-t border-[var(--card-border)] ${compactMode ? 'pt-2' : 'pt-4'}`}>
          <div className={`flex items-center gap-4 text-[var(--muted)] ${compactMode ? 'text-xs gap-2' : 'text-xs'}`}>
          {repo.language && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)]"></span>
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {repo.stars}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            {repo.forks}
          </span>
        </div>
        <span className="text-xs text-[var(--muted)]" title={new Date(repo.updated_at).toLocaleString()}>
          {formatLastUpdated(repo.updated_at)}
        </span>
      </div>
    </div>
  );

  return (
    <section className={`py-12 px-4 bg-[var(--background)]/50 ${compactMode ? 'py-6' : ''}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className={`mb-6 ${compactMode ? 'mb-4' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 
                className={`font-bold mb-1 ${compactMode ? 'text-2xl' : 'text-3xl'}`} 
                style={{ fontFamily: 'var(--font-aldrich)' }}
              >
                Your Repositories
              </h2>
              <p className="text-[var(--muted)] text-sm">
                {sortedAndFilteredRepos.length} of {githubUser.public_repos} repositories
                {pinnedRepositories.length > 0 && ` • ${pinnedRepositories.length} pinned`}
                {searchQuery && ' (filtered)'}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="repo-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repositories... (Press / to focus)"
                className="w-full pl-10 pr-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Language Filter */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="updated">Updated</option>
                <option value="stars">Stars</option>
                <option value="forks">Forks</option>
                <option value="name">Name</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg text-[var(--foreground)] hover:bg-[var(--card-border)]/80"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Pinned Repositories */}
        {pinnedRepositories.length > 0 && !searchQuery && selectedLanguage === 'all' && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-yellow-500 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
              </svg>
              Pinned Repositories
            </h3>
            <div className={`grid ${getGridClasses()} ${getGapClass()}`}>
              {pinnedRepositories.map(repo => (
                <RepoCard key={repo.id} repo={repo} isPinned={true} />
              ))}
            </div>
          </div>
        )}

        {/* All Repositories */}
        {pinnedRepositories.length > 0 && !searchQuery && selectedLanguage === 'all' && (
          <h3 className="text-sm font-semibold text-[var(--muted)] mb-3">
            All Repositories
          </h3>
        )}

        {/* Repository Grid */}
        <div className={`grid ${getGridClasses()} ${getGapClass()}`}>
          {(searchQuery || selectedLanguage !== 'all' ? sortedAndFilteredRepos : unpinnedRepositories).map((repo) => (
            <RepoCard key={repo.id} repo={repo} isPinned={false} />
          ))}
        </div>

        {sortedAndFilteredRepos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[var(--muted)]">No repositories match your search</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedLanguage('all'); }}
              className="mt-4 px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-lg"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
