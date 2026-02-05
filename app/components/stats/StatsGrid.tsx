/**
 * Stats Grid Component
 * Displays key metrics in a responsive grid layout.
 * Maps STATS_DATA to individual stat cards showing:
 * - Total repositories
 * - Active issues
 * - Pull requests
 * - Collaborators
 */
'use client';

import { STATS_DATA } from '@/app/constants/data';
import StatCardComponent from './StatCard';

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
      {/* ===== STATS GRID MAPPING ===== */}
      {STATS_DATA.map((stat) => (
        <StatCardComponent key={stat.id} stat={stat} />
      ))}
    </div>
  );
}
