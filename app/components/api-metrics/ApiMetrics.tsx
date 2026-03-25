/**
 * API Metrics Component
 * Displays response time charts for API endpoints using Highcharts
 * Shows GitHub, Vercel, Discord APIs and overall processing time
 */
'use client';

import { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useApiMetrics, formatResponseTime, getResponseTimeColor } from '@/app/lib/useApiMetrics';

interface MetricHistory {
  timestamp: number;
  value: number | null;
}

interface ApiMetricsProps {
  defaultCollapsed?: boolean;
  alwaysExpanded?: boolean;
}

export default function ApiMetrics({ defaultCollapsed = false, alwaysExpanded = false }: ApiMetricsProps) {
  const { metrics, isLoading, refetch } = useApiMetrics();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
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

  useEffect(() => {
    if (!isLoading && metrics.github.lastUpdated) {
      setHistory(prev => ({
        github: [...prev.github.slice(-19), { timestamp: Date.now(), value: metrics.github.responseTime }],
        vercel: [...prev.vercel.slice(-19), { timestamp: Date.now(), value: metrics.vercel.responseTime }],
        discord: [...prev.discord.slice(-19), { timestamp: Date.now(), value: metrics.discord.responseTime }],
        overall: [...prev.overall.slice(-19), { timestamp: Date.now(), value: metrics.overall.responseTime }],
      }));
    }
  }, [isLoading, metrics.github.lastUpdated]);

  const chartOptions: Highcharts.Options = {
    chart: {
      type: 'line',
      backgroundColor: '#000000',
      height: 300,
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
      labels: {
        style: {
          color: '#A1A1AA',
          fontSize: '11px',
        },
      },
      lineColor: '#333333',
      tickColor: '#333333',
    },
    yAxis: {
      title: {
        text: 'Response Time (ms)',
        style: {
          color: '#A1A1AA',
        },
      },
      labels: {
        style: {
          color: '#A1A1AA',
          fontSize: '11px',
        },
      },
      gridLineColor: '#222222',
    },
    legend: {
      itemStyle: {
        color: '#ffffff',
        fontWeight: '500',
      },
      itemHoverStyle: {
        color: '#0070F3',
      },
    },
    plotOptions: {
      line: {
        marker: {
          enabled: true,
          radius: 4,
          symbol: 'circle',
        },
        lineWidth: 2,
        states: {
          hover: {
            lineWidth: 3,
          },
        },
      },
    },
    tooltip: {
      backgroundColor: '#1a1a1a',
      borderColor: '#333333',
      style: {
        color: '#ffffff',
      },
      valueSuffix: ' ms',
    },
    series: [
      {
        type: 'line',
        name: 'GitHub API',
        data: history.github.map(h => h.value),
        color: '#22c55e',
        marker: {
          fillColor: '#22c55e',
        },
      },
      {
        type: 'line',
        name: 'Vercel API',
        data: history.vercel.map(h => h.value),
        color: '#0070F3',
        marker: {
          fillColor: '#0070F3',
        },
      },
      {
        type: 'line',
        name: 'Discord API',
        data: history.discord.map(h => h.value),
        color: '#5865F2',
        marker: {
          fillColor: '#5865F2',
        },
      },
      {
        type: 'line',
        name: 'Overall',
        data: history.overall.map(h => h.value),
        color: '#f59e0b',
        marker: {
          fillColor: '#f59e0b',
        },
      },
    ],
  };

  if (isLoading && !isCollapsed) {
    return (
      <div className="bg-[#0f0f0f] border border-[#333333] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-[#1a1a1a] rounded w-1/4 mb-4"></div>
          <div className="h-[300px] bg-[#1a1a1a] rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f0f] border border-[#333333] rounded-lg p-6 mb-16">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-[#0070F3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="text-xl font-bold text-white">API Response Times</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="px-3 py-1.5 text-sm bg-[#151515] border border-[#333333] rounded-md text-[#A1A1AA] hover:border-[#555555] hover:text-white transition-all"
          >
            Refresh
          </button>
          {!alwaysExpanded && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="px-3 py-1.5 text-sm bg-[#151515] border border-[#333333] rounded-md text-[#A1A1AA] hover:border-[#555555] hover:text-white transition-all"
            >
              {isCollapsed ? 'Expand' : 'Collapse'}
            </button>
          )}
        </div>
      </div>

      {/* ===== COLLAPSIBLE CONTENT ===== */}
      {(!isCollapsed || alwaysExpanded) && (
        <>
          {/* ===== CHART ===== */}
          <div className="bg-black rounded-lg p-4">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>

          {/* ===== CURRENT METRICS ===== */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-[#A1A1AA] mb-1">GitHub API</div>
              <div className="text-2xl font-bold" style={{ color: getResponseTimeColor(metrics.github.responseTime) }}>
                {formatResponseTime(metrics.github.responseTime)}
              </div>
            </div>
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-[#A1A1AA] mb-1">Vercel API</div>
              <div className="text-2xl font-bold" style={{ color: getResponseTimeColor(metrics.vercel.responseTime) }}>
                {formatResponseTime(metrics.vercel.responseTime)}
              </div>
            </div>
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-[#A1A1AA] mb-1">Discord API</div>
              <div className="text-2xl font-bold" style={{ color: getResponseTimeColor(metrics.discord.responseTime) }}>
                {formatResponseTime(metrics.discord.responseTime)}
              </div>
            </div>
            <div className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4">
              <div className="text-sm text-[#A1A1AA] mb-1">Overall</div>
              <div className="text-2xl font-bold" style={{ color: getResponseTimeColor(metrics.overall.responseTime) }}>
                {formatResponseTime(metrics.overall.responseTime)}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}