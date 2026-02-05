'use client';

import { useGitHubRepos } from '@/app/lib/useGitHub';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ReposSection() {
  const { repos, isLoading, error } = useGitHubRepos();
  const { githubUser } = useAuth();

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

  return (
    <section className="py-12 px-4 bg-slate-900/50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-aldrich)' }}>
            Your Repositories
          </h2>
          <p className="text-slate-400">{githubUser.public_repos} total repositories</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {repos.map((repo) => (
            <a
              key={repo.id}
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 bg-slate-800/80 border border-slate-700 rounded-lg hover:bg-slate-700/80 transition-all hover:shadow-lg hover:shadow-blue-500/10"
            >
              <h3 
                className="text-lg font-semibold text-white mb-2 group-hover:text-blue-400 transition-colors"
                style={{ fontFamily: 'var(--font-aldrich)' }}
              >
                {repo.name}
              </h3>
              <p className="text-sm text-slate-400 mb-4" style={{ fontFamily: 'var(--font-archivo)' }}>
                {repo.description}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span>{repo.language}</span>
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
