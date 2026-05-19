'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Highcharts from 'highcharts';
import { useApiMetrics, formatResponseTime, getResponseTimeColor } from '@/app/lib/useApiMetrics';
import { useTheme } from '@/app/contexts/ThemeContext';

if (typeof document !== 'undefined') {
  const rootStyles = getComputedStyle(document.documentElement);
  const chartBackground = rootStyles.getPropertyValue('--card-bg').trim() || '#0f0f0f';
  const chartBorder = rootStyles.getPropertyValue('--card-border').trim() || '#333333';
  const chartForeground = rootStyles.getPropertyValue('--foreground').trim() || '#e4e4e7';
  const chartTooltip = rootStyles.getPropertyValue('--card-border').trim() || '#1a1a1a';

  const style = document.createElement('style');
  // Theme background overrides for Highcharts elements using CSS variables
  style.innerHTML = `
    .highcharts-background { fill: var(--card-bg, #0f0f0f) !important; }
    .highcharts-plot-background { fill: var(--card-bg, #0f0f0f) !important; }
    .highcharts-root { background-color: var(--card-bg, #0f0f0f) !important; }
    .highcharts-container { background-color: var(--card-bg, #0f0f0f) !important; }
    .highcharts-legend-box { fill: var(--card-bg, #0f0f0f) !important; stroke: var(--card-border, #333333) !important; }
    .highcharts-axis-labels text { fill: var(--foreground, #e4e4e7) !important; }
    .highcharts-axis-title text { fill: var(--foreground, #e4e4e7) !important; }
    .highcharts-grid-line { stroke: var(--card-border, #333333) !important; }
    .highcharts-tick { stroke: var(--card-border, #333333) !important; }
    .highcharts-axis-line { stroke: var(--card-border, #333333) !important; }
    .highcharts-legend-item text { fill: var(--foreground, #e4e4e7) !important; }
    .highcharts-tooltip-box { fill: var(--card-border, #1a1a1a) !important; stroke: var(--card-border, #333333) !important; }
  `;
  document.head.appendChild(style);
  
  Highcharts.setOptions({
    chart: {
      // global chart background definitions
      backgroundColor: 'var(--card-bg)',
      plotBackgroundColor: 'var(--card-bg)',
      plotBorderColor: 'var(--card-border)',
    },
    colors: ['#22c55e', '#0070F3', '#5865F2', '#f59e0b'],
    title: { style: { color: chartForeground } },
    xAxis: {
      lineColor: chartBorder,
      tickColor: chartBorder,
      labels: { style: { color: chartForeground } },
    },
    yAxis: {
      gridLineColor: chartBorder,
      labels: { style: { color: chartForeground } },
      title: { style: { color: chartForeground } },
    },
    legend: {
      backgroundColor: chartBackground,
      borderColor: chartBorder,
      borderWidth: 1,
      itemStyle: { color: chartForeground, fontWeight: '500' },
      itemHoverStyle: { color: '#60a5fa' },
      itemHiddenStyle: { color: '#71717a' },
    },
    tooltip: {
      shared: true,
      backgroundColor: chartTooltip,
      borderColor: chartBorder,
      style: { color: chartForeground },
    },
  });
}

interface MetricHistory {
  timestamp: number;
  value: number | null;
}

interface ApiMetricsProps {
  defaultCollapsed?: boolean;
  alwaysExpanded?: boolean;
}

export default function ApiMetrics({
  defaultCollapsed = false,
  alwaysExpanded = false,
}: Readonly<ApiMetricsProps>) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const { metrics, isLoading, refetch } = useApiMetrics();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<Highcharts.Chart | null>(null);

  const [history, setHistory] = useState<{
    github: MetricHistory[];
    vercel: MetricHistory[];
    discord: MetricHistory[];
    overall: MetricHistory[];
  }>({
    github: [],
    vercel: [],
    discord: [],
    overall: [],
  });

  const hasHistory = history.github.length > 0;

  useEffect(() => {
    if (!isLoading && metrics.github.lastUpdated) {
      const now = Date.now();

      setHistory((prev) => ({
        github: [...prev.github.slice(-19), { timestamp: now, value: metrics.github.responseTime }],
        vercel: [...prev.vercel.slice(-19), { timestamp: now, value: metrics.vercel.responseTime }],
        discord: [...prev.discord.slice(-19), { timestamp: now, value: metrics.discord.responseTime }],
        overall: [...prev.overall.slice(-19), { timestamp: now, value: metrics.overall.responseTime }],
      }));
    }
  }, [
    isLoading,
    metrics.github.lastUpdated,
    metrics.github.responseTime,
    metrics.vercel.responseTime,
    metrics.discord.responseTime,
    metrics.overall.responseTime,
  ]);

  const chartOptions = useMemo<Highcharts.Options>(() => {
    return {
      
      chart: {
        styledMode: false,
        type: 'line',
        height: 300,
        backgroundColor: 'var(--card-bg)',
        plotBackgroundColor: 'var(--card-bg)',
        plotBorderColor: 'var(--card-border)',
        plotBorderWidth: 1,
        style: {
          fontFamily: 'var(--font-sf-pro)',
        },
      },
      title: {
        text: undefined,
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        categories: history.github.map((_, i) => `${i + 1}`),
        lineColor: isDark ? '#333333' : '#cccccc',
        tickColor: isDark ? '#333333' : '#cccccc',
        labels: {
          style: {
            color: isDark ? '#e4e4e7' : '#000000',
            fontSize: '11px',
          },
        },
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Response Time (ms)',
          style: {
            color: isDark ? '#e4e4e7' : '#000000',
          },
        },
        labels: {
          style: {
            color: isDark ? '#e4e4e7' : '#000000',
            fontSize: '11px',
          },
        },
        gridLineColor: isDark ? '#222222' : '#cccccc',
      },
      legend: {
        backgroundColor: isDark ? '#0f0f0f' : '#f9f9f9',
        borderColor: isDark ? '#333333' : '#cccccc',
        borderWidth: 1,
        itemStyle: {
          color: isDark ? '#e4e4e7' : '#000000',
          fontWeight: '500',
        },
        itemHoverStyle: {
          color: '#60a5fa',
        },
        itemHiddenStyle: {
          color: '#71717a',
        },
      },
      tooltip: {
        shared: true,
        backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
        borderColor: isDark ? '#333333' : '#cccccc',
        style: {
          color: isDark ? '#ffffff' : '#000000',
        },
        valueSuffix: ' ms',
      },
      plotOptions: {
        series: {
          animation: false,
        },
        line: {
          lineWidth: 2,
          marker: {
            enabled: true,
            radius: 4,
            symbol: 'circle',
          },
          states: {
            hover: {
              lineWidth: 3,
            },
          },
        },
      },
      series: [
        {
          type: 'line',
          name: 'GitHub API',
          data: history.github.map((h) => h.value ?? null),
          color: '#22c55e',
          marker: {
            fillColor: '#22c55e',
          },
        },
        {
          type: 'line',
          name: 'Vercel API',
          data: history.vercel.map((h) => h.value ?? null),
          color: '#0070F3',
          marker: {
            fillColor: '#0070F3',
          },
        },
        {
          type: 'line',
          name: 'Discord API',
          data: history.discord.map((h) => h.value ?? null),
          color: '#5865F2',
          marker: {
            fillColor: '#5865F2',
          },
        },
        {
          type: 'line',
          name: 'Overall',
          data: history.overall.map((h) => h.value ?? null),
          color: '#f59e0b',
          marker: {
            fillColor: '#f59e0b',
          },
        },
      ],
    };
  }, [history, resolvedTheme]);

  useEffect(() => {
    if (isCollapsed && !alwaysExpanded) return;
    if (!chartRef.current) return;
    if (!hasHistory) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.update(chartOptions, true, true);
      chartInstanceRef.current.reflow();
    } else {
      chartInstanceRef.current = Highcharts.chart(chartRef.current, chartOptions);
    }
  }, [chartOptions, isCollapsed, alwaysExpanded, hasHistory]);

  useEffect(() => {
    if (isCollapsed && !alwaysExpanded && chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }
  }, [isCollapsed, alwaysExpanded]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  if (isLoading && !isCollapsed && !hasHistory) {
    return (
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 mb-16">
        <div className="animate-pulse">
          <div className="h-6 bg-[var(--card-border)] rounded w-1/4 mb-4"></div>
          <div className="h-[300px] bg-[var(--card-border)] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 mb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-[#0070F3]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h2 className="text-xl font-bold text-[var(--foreground)]">API Response Times</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] transition-all"
          >
            Refresh
          </button>

          {!alwaysExpanded && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-3 py-1.5 text-sm bg-[var(--card-bg)] border border-[var(--card-border)] rounded-md text-[var(--muted)] hover:border-[var(--accent)]/40 hover:text-[var(--foreground)] transition-all"
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
        </div>
      </div>

      {(!isCollapsed || alwaysExpanded) && (
        <>
          <div className="relative rounded-lg p-4 bg-[var(--card-bg)]">
            <div ref={chartRef} />
            {isLoading && hasHistory && (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--foreground)]/10 rounded-lg pointer-events-none">
                <span className="text-sm text-[var(--muted)]">Refreshing...</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="text-sm text-[var(--muted)] mb-1">GitHub API</div>
              <div
                className="text-2xl font-bold"
                style={{ color: getResponseTimeColor(metrics.github.responseTime) }}
              >
                {formatResponseTime(metrics.github.responseTime)}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="text-sm text-[var(--muted)] mb-1">Vercel API</div>
              <div
                className="text-2xl font-bold"
                style={{ color: getResponseTimeColor(metrics.vercel.responseTime) }}
              >
                {formatResponseTime(metrics.vercel.responseTime)}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="text-sm text-[var(--muted)] mb-1">Discord API</div>
              <div
                className="text-2xl font-bold"
                style={{ color: getResponseTimeColor(metrics.discord.responseTime) }}
              >
                {formatResponseTime(metrics.discord.responseTime)}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-4">
              <div className="text-sm text-[var(--muted)] mb-1">Overall</div>
              <div
                className="text-2xl font-bold"
                style={{ color: getResponseTimeColor(metrics.overall.responseTime) }}
              >
                {formatResponseTime(metrics.overall.responseTime)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}