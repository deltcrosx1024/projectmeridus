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
          <h2 className="text-3xl font-bold mb-8 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-aldrich)' }}>
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
          <h2 className="text-3xl font-bold mb-2 text-[var(--foreground)]" style={{ fontFamily: 'var(--font-aldrich)' }}>
            Recent Issues
          </h2>
          <p className="text-[var(--muted)]">Issues across your repositories</p>
        </div>

        <div className="space-y-4">
          {issues.map((issue) => (
            <a
              key={issue.id}
              href={issue.url}  
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg hover:bg-[var(--card-border)]/10 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 
                    className="text-base font-semibold text-[var(--foreground)] group-hover:text-blue-400 transition-colors leading-normal"
                    style={{ fontFamily: 'var(--font-aldrich)' }}
                  >
                    #{issue.number} {issue.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] mt-1 leading-normal" style={{ fontFamily: 'var(--font-archivo)' }}>
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
