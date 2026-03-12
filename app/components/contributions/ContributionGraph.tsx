'use client';

import { useMemo } from 'react';
import { useSettingsContext } from '@/app/contexts/SettingsContext';

interface ContributionData {
  date: string;
  count: number;
}

// Generate mock contribution data for the last year
function generateContributionData(): ContributionData[] {
  const data: ContributionData[] = [];
  const today = new Date();
  
  for (let i = 365; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random contribution count with some patterns
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseCount = isWeekend ? 0 : Math.random() > 0.3 ? Math.floor(Math.random() * 10) : 0;
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: baseCount,
    });
  }
  
  return data;
}

function getColorForCount(count: number): string {
  if (count === 0) return 'bg-[#1a1a1a]';
  if (count < 3) return 'bg-green-900/50';
  if (count < 6) return 'bg-green-700/50';
  if (count < 9) return 'bg-green-500/50';
  return 'bg-green-400';
}

function getTooltipText(date: string, count: number): string {
  if (count === 0) return `No contributions on ${date}`;
  if (count === 1) return `1 contribution on ${date}`;
  return `${count} contributions on ${date}`;
}

interface LanguageData {
  name: string;
  percentage: number;
  color: string;
}

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3776ab',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  Go: '#00add8',
  Rust: '#dea584',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
};

export default function ContributionGraph() {
  const { settings } = useSettingsContext();
  const { compactMode } = settings;
  
  const contributionData = useMemo(() => generateContributionData(), []);
  
  // Calculate stats
  const totalContributions = contributionData.reduce((sum, d) => sum + d.count, 0);
  const activeDays = contributionData.filter(d => d.count > 0).length;
  const longestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    for (const day of contributionData) {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }, [contributionData]);

  // Group by weeks
  const weeks = useMemo(() => {
    const result: ContributionData[][] = [];
    for (let i = 0; i < contributionData.length; i += 7) {
      result.push(contributionData.slice(i, i + 7));
    }
    return result;
  }, [contributionData]);

  // Mock language data
  const languages: LanguageData[] = [
    { name: 'TypeScript', percentage: 45, color: LANGUAGE_COLORS.TypeScript },
    { name: 'JavaScript', percentage: 25, color: LANGUAGE_COLORS.JavaScript },
    { name: 'Python', percentage: 15, color: LANGUAGE_COLORS.Python },
    { name: 'CSS', percentage: 10, color: LANGUAGE_COLORS.CSS },
    { name: 'Shell', percentage: 5, color: LANGUAGE_COLORS.Shell },
  ];

  return (
    <section className={`py-8 px-4 ${compactMode ? 'py-4' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contribution Graph */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`font-bold text-white ${compactMode ? 'text-lg' : 'text-xl'}`}>
                Contribution Graph
              </h3>
              <span className="text-sm text-[#A1A1AA]">{totalContributions} contributions in the last year</span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                <p className="text-2xl font-bold text-green-400">{totalContributions}</p>
                <p className="text-xs text-[#A1A1AA]">Contributions</p>
              </div>
              <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{activeDays}</p>
                <p className="text-xs text-[#A1A1AA]">Active Days</p>
              </div>
              <div className="text-center p-3 bg-[#1a1a1a] rounded-lg">
                <p className="text-2xl font-bold text-purple-400">{longestStreak}</p>
                <p className="text-xs text-[#A1A1AA]">Longest Streak</p>
              </div>
            </div>

            {/* Graph */}
            <div className="overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day, dayIndex) => (
                      <div
                        key={dayIndex}
                        className={`w-3 h-3 rounded-sm ${getColorForCount(day.count)} hover:ring-2 hover:ring-white/50 transition-all cursor-pointer`}
                        title={getTooltipText(day.date, day.count)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-[#A1A1AA]">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-[#1a1a1a]" />
                <div className="w-3 h-3 rounded-sm bg-green-900/50" />
                <div className="w-3 h-3 rounded-sm bg-green-700/50" />
                <div className="w-3 h-3 rounded-sm bg-green-500/50" />
                <div className="w-3 h-3 rounded-sm bg-green-400" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* Language Breakdown */}
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6">
            <h3 className={`font-bold text-white mb-4 ${compactMode ? 'text-lg' : 'text-xl'}`}>
              Language Breakdown
            </h3>

            {/* Pie Chart Visualization */}
            <div className="flex items-center gap-8 mb-6">
              {/* Simple SVG Pie Chart */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  {languages.reduce((acc, lang, index) => {
                    const prevOffset = index === 0 ? 0 : acc.offset;
                    const dashArray = `${lang.percentage} ${100 - lang.percentage}`;
                    const circle = (
                      <circle
                        key={lang.name}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={lang.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={-prevOffset}
                      />
                    );
                    return { offset: prevOffset + lang.percentage, elements: [...acc.elements, circle] };
                  }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{languages.length}</span>
                </div>
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-2">
                {languages.map((lang) => (
                  <div key={lang.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: lang.color }}
                      />
                      <span className="text-sm text-white">{lang.name}</span>
                    </div>
                    <span className="text-sm text-[#A1A1AA]">{lang.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Language Bars */}
            <div className="space-y-3">
              {languages.map((lang) => (
                <div key={lang.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{lang.name}</span>
                    <span className="text-xs text-[#A1A1AA]">{lang.percentage}%</span>
                  </div>
                  <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
