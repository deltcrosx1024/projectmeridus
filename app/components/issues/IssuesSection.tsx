'use client';

import { useGitHubIssues } from '@/app/lib/useGitHub';
import { useAuth } from '@/app/contexts/AuthContext';

export default function IssuesSection() {
  const { issues, isLoading, error } = useGitHubIssues();
  const { githubUser } = useAuth();

  if (!githubUser) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-aldrich)' }}>
            Loading Issues...
          </h2>
        </div>
      </section>
    );
  }

  if (error || issues.length === 0) {
    return null;
  }

  return (
    <section className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-aldrich)' }}>
            Recent Issues
          </h2>
          <p className="text-slate-400">Issues across your repositories</p>
        </div>

        <div className="space-y-4">
          {issues.map((issue) => (
            <a
              key={issue.id}
              href={issue.url}  
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 
                    className="text-base font-semibold text-white group-hover:text-blue-400 transition-colors leading-normal"
                    style={{ fontFamily: 'var(--font-aldrich)' }}
                  >
                    #{issue.number} {issue.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-normal" style={{ fontFamily: 'var(--font-archivo)' }}>
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span 
                  className={`text-xs px-2 py-1 rounded ${
                    issue.state === 'open' 
                      ? 'bg-green-900/50 text-green-300' 
                      : 'bg-red-900/50 text-red-300'
                  }`}
                >
                  {issue.state}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
