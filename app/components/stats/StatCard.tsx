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
import { useTheme } from '@/app/contexts/ThemeContext';

interface StatCardProps {
  stat: StatCard;
}

export default function StatCardComponent({ stat }: StatCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  
  const colorMap = {
    green: 'text-[#22c55e]',
    orange: 'text-[#f59e0b]',
    blue: 'text-[#0070F3]',
    purple: 'text-[#a855f7]',
  };

  return (
    <div className={`border rounded-lg p-6 hover:transition-all ${isDark ? 'bg-[#0a0a0a] border-[#333333] hover:border-[#555555]' : 'bg-white border-gray-300 hover:border-gray-400'}`}>
      {/* ===== STAT LABEL ===== */}
      <div className={`text-sm font-semibold mb-2 ${isDark ? 'text-[#A1A1AA]' : 'text-gray-600'}`}>{stat.label}</div>

      {/* ===== STAT VALUE ===== */}
      <div className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</div>

      {/* ===== STAT CHANGE ===== */}
      <div className={`text-sm ${colorMap[stat.changeColor]}`}>{stat.change}</div>
    </div>
  );
}
