/**
 * Header Component
 * Sticky navigation bar with logo and navigation menu items.
 * Features:
 * - Sticky positioning at top of page
 * - Dynamic navigation items from data
 * - Gradient logo badge
 */
'use client';

import { NAV_ITEMS } from '@/app/constants/data';

export default function Header() {
  return (
    <header className="border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* ===== LOGO SECTION ===== */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg" style={{ fontFamily: 'var(--font-aldrich)' }}>M </span>
            </div>
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-aldrich)' }}>MERIDUS</span>
          </div>

          {/* ===== NAVIGATION SECTION ===== */}
          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                className="text-slate-300 hover:text-white font-aldrich transition-colors"
              >

                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
