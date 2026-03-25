'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';
import { useAuth } from '@/app/contexts/AuthContext';
import { useGitHubRepos, useGitHubIssues } from '@/app/lib/useGitHub';
import ContributionGraph from '@/app/components/contributions/ContributionGraph';
import ApiMetrics from '@/app/components/api-metrics/ApiMetrics';
import DiscordStatus from '@/app/components/discord-status/DiscordStatus';

export default function InsightsPage() {
  const { githubUser } = useAuth();
  const { repos, isLoading: reposLoading } = useGitHubRepos();
  const { issues, isLoading: issuesLoading } = useGitHubIssues();

  if (!githubUser) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-[#A1A1AA]">Please connect GitHub to view insights</p>
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
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Insights
          </h1>
          <p className="text-[#A1A1AA]">
            Your GitHub activity overview
          </p>
        </div>

        {/* ===== API & STATUS SECTION ===== */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            API & Status
          </h2>
          <ApiMetrics alwaysExpanded={true} />
          <div className="mt-8">
            <DiscordStatus />
          </div>
        </div>

        {/* Contribution Graph & Language Breakdown */}
        <ContributionGraph />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
            <p className="text-[#A1A1AA] text-sm">Total Repositories</p>
            <p className="text-3xl font-bold text-white mt-2">
              {repos.length}
            </p>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
            <p className="text-[#A1A1AA] text-sm">Total Stars</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {totalStars}
            </p>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
            <p className="text-[#A1A1AA] text-sm">Total Forks</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {totalForks}
            </p>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
            <p className="text-[#A1A1AA] text-sm">Followers</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">
              {githubUser.followers}
            </p>
          </div>
        </div>

        {/* Issues Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              Issues Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Open Issues</span>
                <span className="text-green-400 font-semibold">{openIssues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Closed Issues</span>
                <span className="text-red-400 font-semibold">{closedIssues}</span>
              </div>
              <div className="pt-3 border-t border-[#333333] flex justify-between">
                <span className="text-[#A1A1AA]">Total Issues</span>
                <span className="text-blue-400 font-semibold">{issues.length}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">
              User Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Public Repos</span>
                <span className="text-blue-400 font-semibold">{githubUser.public_repos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#A1A1AA]">Followers</span>
                <span className="text-purple-400 font-semibold">{githubUser.followers}</span>
              </div>
              <div className="pt-3 border-t border-[#333333]">
                <p className="text-[#A1A1AA] text-sm">{githubUser.bio}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Top Repositories */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
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
                  className="p-4 bg-[#0a0a0a] border border-[#333333] rounded-lg hover:border-[#555555] transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white group-hover:text-[#0070F3] transition-colors">
                        {repo.name}
                      </h3>
                      <p className="text-sm text-[#A1A1AA]">{repo.language}</p>
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
