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
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-2">
          Your Insights
        </h2>
        <p className="text-[var(--muted)] text-sm md:text-base">
          Activity frequency and latest commits across all your repositories
        </p>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="p-4 md:p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
          <p className="text-[var(--muted)] text-xs md:text-sm">Last 24 hours</p>
          <p className="text-2xl md:text-3xl font-bold text-green-400 mt-1 md:mt-2">
            {last24h}
          </p>
        </div>
        <div className="p-4 md:p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
          <p className="text-[var(--muted)] text-xs md:text-sm">Last 7 days</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-400 mt-1 md:mt-2">
            {last7d}
          </p>
        </div>
        <div className="p-4 md:p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
          <p className="text-[var(--muted)] text-xs md:text-sm">Last 30 days</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-400 mt-1 md:mt-2">
            {last30d}
          </p>
        </div>
      </div>

      {/* Activity Frequency Chart */}
      <div className="p-4 md:p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base md:text-lg font-semibold text-[var(--foreground)]">
              Activity Frequency
            </h3>
            <p className="text-xs text-[var(--muted)] mt-1">Commits by day of week</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0070F3]"></div>
              <span className="text-[var(--muted)]">Commits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#0070F3]/30"></div>
              <span className="text-[var(--muted)]">Average</span>
            </div>
          </div>
        </div>
        
        {/* Bar Chart */}
        <div className="relative">
          {/* Background grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-full h-px bg-[#1a1a1a]" />
            ))}
          </div>
          
          <div className="relative flex justify-between items-end h-32 md:h-40 gap-2 md:gap-3 px-2">
            {activityByDay.map(({ day, count }, index) => {
              const heightPercent = maxActivity > 0 ? (count / maxActivity) * 100 : 0;
              const avgActivity = activityByDay.reduce((sum, a) => sum + a.count, 0) / activityByDay.length || 0;
              const avgHeightPercent = maxActivity > 0 ? (avgActivity / maxActivity) * 100 : 0;
              
              return (
                <div key={day} className="flex flex-col items-center flex-1 group">
                  {/* Count tooltip */}
                  <div className="mb-2 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8">
                    <span className="px-2 py-1 bg-[var(--card-bg)] text-[var(--foreground)] text-xs rounded-md border border-[var(--card-border)] whitespace-nowrap">
                      {count} commit{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Bar container */}
                  <div className="w-full relative h-24 md:h-32 flex items-end justify-center">
                    {/* Average line indicator */}
                    <div 
                      className="absolute w-full h-px bg-[#0070F3]/30 border-t border-dashed border-[#0070F3]/50"
                      style={{ bottom: `${Math.max(avgHeightPercent, 4)}%` }}
                    />
                    
                    {/* Main bar */}
                    <div 
                      className="w-full max-w-[40px] relative rounded-t-md transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(0,112,243,0.3)]"
                      style={{ 
                        height: `${Math.max(heightPercent, 4)}%`,
                      }}
                    >
                      {/* Gradient fill */}
                      <div 
                        className="absolute inset-0 rounded-t-md"
                        style={{
                          background: `linear-gradient(180deg, #0070F3 0%, rgba(0,112,243,0.4) 100%)`,
                        }}
                      />
                      {/* Animated shine effect */}
                      <div className="absolute inset-0 rounded-t-md bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    </div>
                  </div>
                  
                  {/* Day label */}
                  <div className="mt-3 text-center">
                    <span className="text-xs font-medium text-[#A1A1AA] group-hover:text-white transition-colors">{day}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-6 pt-4 border-t border-[var(--card-border)] flex flex-wrap justify-between items-center gap-4">
          <div className="text-xs text-[var(--muted)]">
            Total: <span className="text-[var(--foreground)] font-medium">{commits.length}</span> commits
          </div>
          <div className="text-xs text-[var(--muted)]">
            Busiest: <span className="text-[#0070F3] font-medium">
              {activityByDay.reduce((max, a) => a.count > max.count ? a : max, activityByDay[0])?.day || 'N/A'}
            </span>
          </div>
          <div className="text-xs text-[var(--muted)]">
            Avg/day: <span className="text-[var(--foreground)] font-medium">
              {(activityByDay.reduce((sum, a) => sum + a.count, 0) / activityByDay.filter(a => a.count > 0).length || 0).toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Latest Commits */}
      <div className="p-4 md:p-6 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg">
        <h3 className="text-base md:text-lg font-semibold text-[var(--foreground)] mb-3 md:mb-4">
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
          <p className="text-[var(--muted)] text-center py-8">No commits found</p>
        ) : (
          <div className="space-y-2 md:space-y-3 max-h-64 md:max-h-96 overflow-y-auto">
            {commits.slice(0, 10).map((commit) => (
              <a
                key={commit.sha}
                href={commit.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 md:gap-4 p-2 md:p-3 bg-[var(--card-bg)] hover:bg-[var(--card-border)]/10 rounded-lg transition-all group"
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
                  <p className="text-[var(--foreground)] text-xs md:text-sm font-medium truncate group-hover:text-[#0070F3] transition-colors">
                    {truncateMessage(commit.message)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 md:gap-2 text-[10px] md:text-xs text-[var(--muted)]">
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
