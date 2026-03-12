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
    green: 'text-[#22c55e]',
    orange: 'text-[#f59e0b]',
    blue: 'text-[#0070F3]',
    purple: 'text-[#a855f7]',
  };

  return (
    <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-6 hover:border-[#555555] transition-all">
      {/* ===== STAT LABEL ===== */}
      <div className="text-[#A1A1AA] text-sm font-semibold mb-2">{stat.label}</div>

      {/* ===== STAT VALUE ===== */}
      <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>

      {/* ===== STAT CHANGE ===== */}
      <div className={`text-sm ${colorMap[stat.changeColor]}`}>{stat.change}</div>
    </div>
  );
}
