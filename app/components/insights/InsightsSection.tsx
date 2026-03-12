'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useGitHubRepos, useGitHubCommits } from '@/app/lib/useGitHub';

export default function InsightsSection() {
  const { githubUser } = useAuth();
  const { repos, isLoading: reposLoading } = useGitHubRepos();
  const { commits, isLoading: commitsLoading } = useGitHubCommits(5, 10);

  if (!githubUser) {
    return null;
  }

  // Calculate activity frequency from commits
  const getActivityByDay = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activity = days.map(() => 0);
    
    commits.forEach(commit => {
      if (commit.date) {
        const dayIndex = new Date(commit.date).getDay();
        activity[dayIndex]++;
      }
    });
    
    return days.map((day, i) => ({ day, count: activity[i] }));
  };

  const activityByDay = getActivityByDay();
  const maxActivity = Math.max(...activityByDay.map(a => a.count), 1);

  // Calculate recent activity stats
  const now = new Date();
  const last24h = commits.filter(c => c.date && (now.getTime() - new Date(c.date).getTime()) < 24 * 60 * 60 * 1000).length;
  const last7d = commits.filter(c => c.date && (now.getTime() - new Date(c.date).getTime()) < 7 * 24 * 60 * 60 * 1000).length;
  const last30d = commits.filter(c => c.date && (now.getTime() - new Date(c.date).getTime()) < 30 * 24 * 60 * 60 * 1000).length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const truncateMessage = (msg: string, maxLen = 60) => {
    const firstLine = msg.split('\n')[0];
    return firstLine.length > maxLen ? firstLine.substring(0, maxLen) + '...' : firstLine;
  };

  return (
    <section className="py-8 md:py-16">
      <div className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Your Insights
        </h2>
        <p className="text-[#A1A1AA] text-sm md:text-base">
          Activity frequency and latest commits across all your repositories
        </p>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="p-4 md:p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
          <p className="text-[#A1A1AA] text-xs md:text-sm">Last 24 hours</p>
          <p className="text-2xl md:text-3xl font-bold text-green-400 mt-1 md:mt-2">
            {last24h}
          </p>
        </div>
        <div className="p-4 md:p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
          <p className="text-[#A1A1AA] text-xs md:text-sm">Last 7 days</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1 md:mt-2">
            {last7d}
          </p>
        </div>
        <div className="p-4 md:p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
          <p className="text-[#A1A1AA] text-xs md:text-sm">Last 30 days</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-400 mt-1 md:mt-2">
            {last30d}
          </p>
        </div>
      </div>

      {/* Activity Frequency Chart */}
      <div className="p-4 md:p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg mb-6 md:mb-8">
        <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6">
          Activity Frequency (by day)
        </h3>
        <div className="flex justify-between items-end h-24 md:h-40 gap-1 md:gap-2">
          {activityByDay.map(({ day, count }) => (
            <div key={day} className="flex flex-col items-center flex-1">
              <div className="w-full relative h-20 md:h-32 flex items-end">
                <div 
                  className="w-full bg-gradient-to-t from-[#0070F3] to-blue-400 rounded-t-md transition-all duration-300 min-h-[4px]"
                  style={{ 
                    height: `${Math.max((count / maxActivity) * 100, 4)}%`,
                  }}
                />
              </div>
              <span className="text-[10px] md:text-xs text-[#A1A1AA] mt-1 md:mt-2">{day}</span>
              <span className="text-[10px] md:text-xs text-[#666666]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Latest Commits */}
      <div className="p-4 md:p-6 bg-[#0a0a0a] border border-[#333333] rounded-lg">
        <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">
          Latest Commits
        </h3>
        
        {commitsLoading ? (
          <div className="space-y-2 md:space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-2 md:gap-4">
                <div className="w-6 h-6 md:w-8 md:h-8 bg-[#1a1a1a] rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1 md:space-y-2">
                  <div className="h-3 md:h-4 bg-[#1a1a1a] rounded w-3/4" />
                  <div className="h-2 md:h-3 bg-[#1a1a1a] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : commits.length === 0 ? (
          <p className="text-[#A1A1AA] text-center py-8">No commits found</p>
        ) : (
          <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
            {commits.slice(0, 10).map((commit) => (
              <a
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-[#1a1a1a] hover:bg-[#252525] rounded-lg transition-all group"
              >
                {commit.avatar_url ? (
                  <img 
                    src={commit.avatar_url} 
                    alt={commit.author}
                    className="w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-[#333333] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] md:text-xs text-white">{commit.author.charAt(0)}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs md:text-sm font-medium truncate group-hover:text-[#0070F3] transition-colors">
                    {truncateMessage(commit.message)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[10px] md:text-xs text-[#A1A1AA]">
                    <span className="font-mono text-[#0070F3]">{commit.repo_owner}/{commit.repo_name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{formatDate(commit.date)}</span>
                  </div>
                </div>
                <div className="text-[10px] md:text-xs font-mono text-[#666666] flex-shrink-0">
                  {commit.sha.substring(0, 7)}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
