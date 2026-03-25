'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export interface DiscordServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'partial_outage' | 'major_outage';
  description?: string;
}

interface DiscordStatusResponse {
  page: {
    id: string;
    name: string;
    url: string;
  };
  status: {
    indicator: string;
    description: string;
  };
  components: DiscordServiceStatus[];
}

export function useDiscordStatus() {
  const [services, setServices] = useState<DiscordServiceStatus[]>([]);
  const [overallStatus, setOverallStatus] = useState<string>('unknown');
  const [overallDescription, setOverallDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('https://discordstatus.com/api/v2/status.json');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DiscordStatusResponse = await response.json();
      
      const componentsResponse = await fetch('https://discordstatus.com/api/v2/components.json');
      const componentsData = await componentsResponse.json();
      
      const relevantServices = componentsData.components
        .filter((c: any) => {
          const name = c.name.toLowerCase();
          return !c.group && (
            name.includes('api') || 
            name.includes('gateway') || 
            name.includes('media') || 
            name.includes('search') || 
            name.includes('voice') ||
            name.includes('push') ||
            name.includes('search') ||
            name.includes('developer') ||
            name.includes('interactions')
          );
        })
        .map((c: any) => ({
          name: c.name,
          status: c.status,
        }));
      
      setServices(relevantServices);
      setOverallStatus(data.status.indicator);
      setOverallDescription(data.status.description);
      setError(null);
    } catch (err: any) {
      console.error('useDiscordStatus error', err);
      setError(err.message || 'Failed to fetch Discord status');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    intervalRef.current = setInterval(fetchStatus, 15000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStatus]);

  return { 
    services, 
    overallStatus, 
    overallDescription,
    isLoading, 
    error, 
    refetch: fetchStatus 
  };
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'operational':
      return '#22c55e';
    case 'degraded':
      return '#f59e0b';
    case 'partial_outage':
      return '#f97316';
    case 'major_outage':
      return '#ef4444';
    case 'major':
      return '#ef4444';
    case 'minor':
      return '#f59e0b';
    case 'critical':
      return '#dc2626';
    default:
      return '#A1A1AA';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'operational':
      return 'Operational';
    case 'degraded':
      return 'Degraded';
    case 'partial_outage':
      return 'Partial Outage';
    case 'major_outage':
      return 'Major Outage';
    case 'major':
      return 'Major Outage';
    case 'minor':
      return 'Minor Outage';
    case 'critical':
      return 'Critical';
    default:
      return 'Unknown';
  }
}