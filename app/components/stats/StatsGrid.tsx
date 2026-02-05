/**
 * Stats Grid Component
 * Displays key metrics in a responsive grid layout.
 * Fetches real data from GitHub API:
 * - Total repositories
 * - Active issues
 * - Pull requests
 * - Followers (as collaborators proxy)
 */
'use client';

import { useGitHubRepos, useGitHubIssues, useGitHubPullRequests } from '@/app/lib/useGitHub';
import { useAuth } from '@/app/contexts/AuthContext';
import StatCardComponent from './StatCard';

export default function StatsGrid() {
  const { githubUser } = useAuth();
  const { repos } = useGitHubRepos();
  const { issues } = useGitHubIssues();
  const { prs } = useGitHubPullRequests();

  const stats = [
    {
      id: 'repositories',
      label: 'Total Repositories',
      value: repos.length,
      change: `+${repos.length} public repos`,
      changeColor: 'green' as const,
    },
    {
      id: 'issues',
      label: 'Active Issues',
      value: issues.filter(i => i.state === 'open').length,
      change: `${issues.filter(i => i.state === 'closed').length} closed`,
      changeColor: 'orange' as const,
    },
    {
      id: 'pullRequests',
      label: 'Pull Requests',
      value: prs.filter(pr => pr.state === 'open').length,
      change: `${prs.filter(pr => pr.state === 'closed').length} merged`,
      changeColor: 'blue' as const,
    },
    {
      id: 'collaborators',
      label: 'Followers',
      value: githubUser?.followers || 0,
      change: 'Community members',
      changeColor: 'purple' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
      {/* ===== STATS GRID MAPPING ===== */}
      {stats.map((stat) => (
        <StatCardComponent key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
