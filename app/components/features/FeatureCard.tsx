/**
 * Feature Card Component
 * Individual feature card with icon, title, description, and color variants.
 * 
 * Props:
 * @param {FeatureCard} feature - Feature data containing id, title, description, icon, and color
 * 
 * Features:
 * - Dynamic icon mapping (settings, chart, users, lightning, lock, lightbulb)
 * - Color-coded variants (blue, cyan, purple, green, orange, pink)
 * - Hover effects with smooth transitions
 * - Responsive grid layout
 */
'use client';

import { FeatureCard } from '@/app/types';

interface FeatureCardProps {
  feature: FeatureCard;
}

const iconMap: Record<string, React.ReactNode> = {
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 10H9m6 0a6 6 0 11-12 0 6 6 0 0112 0z" />
    </svg>
  ),
  lightning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  lightbulb: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5h.01" />
    </svg>
  ),
};

const colorMap = {
  blue: {
    bg: 'bg-blue-500/20',
    hover: 'group-hover:bg-blue-500/30',
    text: 'text-blue-400',
    border: 'hover:border-blue-500/50',
  },
  cyan: {
    bg: 'bg-cyan-500/20',
    hover: 'group-hover:bg-cyan-500/30',
    text: 'text-cyan-400',
    border: 'hover:border-cyan-500/50',
  },
  purple: {
    bg: 'bg-purple-500/20',
    hover: 'group-hover:bg-purple-500/30',
    text: 'text-purple-400',
    border: 'hover:border-purple-500/50',
  },
  green: {
    bg: 'bg-green-500/20',
    hover: 'group-hover:bg-green-500/30',
    text: 'text-green-400',
    border: 'hover:border-green-500/50',
  },
  orange: {
    bg: 'bg-orange-500/20',
    hover: 'group-hover:bg-orange-500/30',
    text: 'text-orange-400',
    border: 'hover:border-orange-500/50',
  },
  pink: {
    bg: 'bg-pink-500/20',
    hover: 'group-hover:bg-pink-500/30',
    text: 'text-pink-400',
    border: 'hover:border-pink-500/50',
  },
};

export default function FeatureCardComponent({ feature }: FeatureCardProps) {
  const colors = colorMap[feature.color];

  return (
    <div className={`bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-lg p-8 transition-all group ${colors.border}`}>
      {/* ===== FEATURE ICON ===== */}
      <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center mb-4 ${colors.hover} transition-all`}>
        <div className={colors.text}>{iconMap[feature.icon]}</div>
      </div>

      {/* ===== FEATURE TITLE ===== */}
      <h3 className="text-lg font-semibold text-white mb-2" style={{ fontFamily: 'var(--font-aldrich)' }}>{feature.title}</h3>

      {/* ===== FEATURE DESCRIPTION ===== */}
      <p className="text-slate-400" style={{ fontFamily: 'var(--font-archivo)' }}>{feature.description}</p>
    </div>
  );
}
