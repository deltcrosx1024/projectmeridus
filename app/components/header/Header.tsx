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
import { handleGitHubLogin, handleDiscordLogin } from '@/app/lib/oauth';

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

          {/* ===== AUTH BUTTONS SECTION ===== */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub
            </button>
            <button
              onClick={() => handleDiscordLogin(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M16.92 0H3.08A3.08 3.08 0 000 3.08v13.84A3.08 3.08 0 003.08 20h13.84A3.08 3.08 0 0020 16.92V3.08A3.08 3.08 0 0016.92 0zM13.5 13.5a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5zm0-4a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5zm-4 4a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5zm0-4a.5.5 0 01-.5.5h-2v-2a.5.5 0 010-1h2a.5.5 0 01.5.5v2.5z" />
              </svg>
              Discord
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
