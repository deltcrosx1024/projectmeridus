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
    <div className="border rounded-lg p-6 bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--accent)]/20 transition-all"> {/* card surface now uses theme variables */}
      {/* ===== STAT LABEL ===== */}
      <div className="text-sm font-semibold mb-2 text-[var(--muted)]">{stat.label}</div>

      {/* ===== STAT VALUE ===== */}
      <div className="text-4xl font-bold mb-2 text-[var(--foreground)]">{stat.value}</div>

      {/* ===== STAT CHANGE ===== */}
      <div className={`text-sm ${colorMap[stat.changeColor]}`}>{stat.change}</div>
    </div>
  );
}
