'use client';

import { useGitHubRepos } from '@/app/lib/useGitHub';
import { useAuth } from '@/app/contexts/AuthContext';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

export default function ReposSection() {
  const { repos, isLoading, error } = useGitHubRepos();
  const { githubUser } = useAuth();
  const { settings } = useSettingsContext();
  const { compactMode, defaultView } = settings;

  if (!githubUser) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400">Connect GitHub to see your repositories</p>
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

  // Determine gap based on compact mode
  const getGapClass = () => {
    return compactMode ? 'gap-3' : 'gap-6';
  };

  // Determine card padding based on compact mode
  const getCardPadding = () => {
    return compactMode ? 'p-4' : 'p-6';
  };

  return (
    <section className={`py-12 px-4 bg-slate-900/50 ${compactMode ? 'py-6' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`mb-8 ${compactMode ? 'mb-4' : ''}`}>
          <h2 
            className={`font-bold mb-2 ${compactMode ? 'text-2xl' : 'text-3xl'}`} 
            style={{ fontFamily: 'var(--font-aldrich)' }}
          >
            Your Repositories
          </h2>
          <p className="text-slate-400">{githubUser.public_repos} total repositories</p>
        </div>

        <div className={`grid ${getGridClasses()} ${getGapClass()}`}>
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group ${getCardPadding()} bg-slate-800/80 border border-slate-700 rounded-lg hover:bg-slate-700/80 transition-all hover:shadow-lg hover:shadow-blue-500/10 ${compactMode ? 'text-sm' : ''}`}
            >
              <h3 
                className={`font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors ${compactMode ? 'text-base' : 'text-lg'}`}
                style={{ fontFamily: 'var(--font-aldrich)' }}
              >
                {repo.name}
              </h3>
              <p className={`text-slate-400 mb-4 ${compactMode ? 'text-xs mb-2 line-clamp-2' : 'text-sm'}`} style={{ fontFamily: 'var(--font-archivo)' }}>
                {repo.description}
              </p>
              <div className={`flex items-center justify-between border-t border-slate-700 ${compactMode ? 'pt-2' : 'pt-4'}`}>
                <div className={`flex items-center gap-4 text-slate-400 ${compactMode ? 'text-xs gap-2' : 'text-xs'}`}>
                  {repo.language && <span>{repo.language}</span>}
                  <span>⭐ {repo.stars}</span>
                  <span>🍴 {repo.forks}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
