/**
 * Stat Card Component
 * Individual statistic display card with label, value, and change indicator.
 * Props:
 * @param {StatCard} stat - The stat data object containing label, value, change, and changeColor
 * 
 * Features:
 * - Color-coded change indicators (green, orange, blue, purple)
 * - Hover effects with backdrop blur
 * - Responsive design
 */
'use client';

import { StatCard } from '@/app/types';

interface StatCardProps {
  stat: StatCard;
}

export default function StatCardComponent({ stat }: StatCardProps) {
  const colorMap = {
    green: 'text-green-400',
    orange: 'text-orange-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-6 hover:bg-slate-800/80 transition-all">
      {/* ===== STAT LABEL ===== */}
      <div className="text-slate-400 text-sm font-semibold mb-2" style={{ fontFamily: 'var(--font-aldrich)' }}>{stat.label}</div>

      {/* ===== STAT VALUE ===== */}
      <div className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-aldrich)' }}>{stat.value}</div>

      {/* ===== STAT CHANGE ===== */}
      <div className={`text-sm ${colorMap[stat.changeColor]}`}>{stat.change}</div>
    </div>
  );
}
