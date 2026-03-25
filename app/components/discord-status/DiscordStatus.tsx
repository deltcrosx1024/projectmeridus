/**
 * Discord Status Component
 * Displays real-time Discord service status from discordstatus.com
 * Shows all Discord services with their current operational status
 */
'use client';

import { useDiscordStatus, getStatusColor, getStatusLabel } from '@/app/lib/useDiscordStatus';

export default function DiscordStatus() {
  const { services, overallStatus, overallDescription, isLoading, error } = useDiscordStatus();

  const statusColor = getStatusColor(overallStatus);
  const statusLabel = getStatusLabel(overallStatus);

  const statusLegend = [
    { status: 'operational', label: 'Operational', color: '#22c55e' },
    { status: 'degraded', label: 'Degraded', color: '#f59e0b' },
    { status: 'partial_outage', label: 'Partial Outage', color: '#f97316' },
    { status: 'major_outage', label: 'Major Outage', color: '#ef4444' },
  ];

  if (isLoading) {
    return (
      <div className="bg-[#0f0f0f] border border-[#333333] rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-[#1a1a1a] rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-[#1a1a1a] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#0f0f0f] border border-[#333333] rounded-lg p-6">
        <div className="text-red-500 text-sm">Failed to load Discord status</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f0f0f] border border-[#333333] rounded-lg p-6 mb-16">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          <h2 className="text-xl font-bold text-white">Discord Status</h2>
        </div>
        <div className="flex items-center gap-2">
          <span 
            className="w-3 h-3 rounded-full animate-pulse" 
            style={{ backgroundColor: statusColor }}
          ></span>
          <span className="text-sm font-medium" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* ===== STATUS LEGEND (Right side, vertical) ===== */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="text-sm font-semibold text-[#A1A1AA] mb-3">Status Legend</div>
          <div className="space-y-3">
            {statusLegend.map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-md flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-white">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== SERVICES GRID (Horizontal) ===== */}
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {services.map((service, index) => (
              <div 
                key={index}
                className="bg-[#151515] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#444444] transition-all"
              >
                <div className="text-sm font-medium text-white mb-3 truncate">
                  {service.name}
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: getStatusColor(service.status) }}
                  ></div>
                  <span 
                    className="text-xs"
                    style={{ color: getStatusColor(service.status) }}
                  >
                    {getStatusLabel(service.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}