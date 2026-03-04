'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGitHubRepos, useGitHubIssues } from '@/app/lib/useGitHub';
import ContributionGraph from '@/app/components/contributions/ContributionGraph';

export default function InsightsPage() {
  const { githubUser } = useAuth();
  const { repos, isLoading: reposLoading } = useGitHubRepos();
  const { issues, isLoading: issuesLoading } = useGitHubIssues();

  if (!githubUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-slate-400">Please connect GitHub to view insights</p>
        </main>
        <Footer />
      </div>
    );
  }

  const totalStars = repos.reduce((acc, repo) => acc + repo.stars, 0);
  const totalForks = repos.reduce((acc, repo) => acc + repo.forks, 0);
  const openIssues = issues.filter((issue) => issue.state === 'open').length;
  const closedIssues = issues.filter((issue) => issue.state === 'closed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-aldrich)' }}
          >
            Insights
          </h1>
          <p className="text-slate-400" style={{ fontFamily: 'var(--font-archivo)' }}>
            Your GitHub activity overview
          </p>
        </div>

        {/* Contribution Graph & Language Breakdown */}
        <ContributionGraph />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-lg">
            <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-archivo)' }}>Total Repositories</p>
            <p 
              className="text-3xl font-bold text-white mt-2"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              {repos.length}
            </p>
          </div>

          <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-lg">
            <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-archivo)' }}>Total Stars</p>
            <p 
              className="text-3xl font-bold text-yellow-400 mt-2"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              {totalStars}
            </p>
          </div>

          <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-lg">
            <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-archivo)' }}>Total Forks</p>
            <p 
              className="text-3xl font-bold text-blue-400 mt-2"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              {totalForks}
            </p>
          </div>

          <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-lg">
            <p className="text-slate-400 text-sm" style={{ fontFamily: 'var(--font-archivo)' }}>Followers</p>
            <p 
              className="text-3xl font-bold text-purple-400 mt-2"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              {githubUser.followers}
            </p>
          </div>
        </div>

        {/* Issues Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-lg">
            <h3 
              className="text-lg font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              Issues Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Open Issues</span>
                <span className="text-green-400 font-semibold">{openIssues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Closed Issues</span>
                <span className="text-red-400 font-semibold">{closedIssues}</span>
              </div>
              <div className="pt-3 border-t border-slate-700 flex justify-between">
                <span className="text-slate-400">Total Issues</span>
                <span className="text-blue-400 font-semibold">{issues.length}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800/80 border border-slate-700 rounded-lg">
            <h3 
              className="text-lg font-semibold text-white mb-4"
              style={{ fontFamily: 'var(--font-aldrich)' }}
            >
              User Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Public Repos</span>
                <span className="text-blue-400 font-semibold">{githubUser.public_repos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Followers</span>
                <span className="text-purple-400 font-semibold">{githubUser.followers}</span>
              </div>
              <div className="pt-3 border-t border-slate-700">
                <p className="text-slate-400 text-sm">{githubUser.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Repositories */}
        <div>
          <h2 
            className="text-2xl font-bold text-white mb-6"
            style={{ fontFamily: 'var(--font-aldrich)' }}
          >
            Top Repositories by Stars
          </h2>
          <div className="space-y-3">
            {repos
              .sort((a, b) => b.stars - a.stars)
              .slice(0, 5)
              .map((repo) => (
                <a
                  key={repo.id}
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 
                        className="text-white group-hover:text-blue-400 transition-colors"
                        style={{ fontFamily: 'var(--font-aldrich)' }}
                      >
                        {repo.name}
                      </h3>
                      <p className="text-sm text-slate-400">{repo.language}</p>
                    </div>
                    <span className="text-yellow-400 font-semibold">⭐ {repo.stars}</span>
                  </div>
                </a>
              ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
