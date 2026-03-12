/**
 * Header Component
 * Sticky navigation bar with logo and navigation menu items.
 * Features:
 * - Sticky positioning at top of page
 * - Dynamic navigation items from data
 * - Gradient logo badge
 * - OAuth authentication buttons
 * - Mobile responsive with hamburger menu
 */
'use client';

import { NAV_ITEMS } from '@/app/constants/data';
import { handleGitHubLogin, handleDiscordLogin, handleVercelLogin } from '@/app/lib/oauth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useState } from 'react';
import Link from 'next/link';
import NotificationCenter from '@/app/components/notifications/NotificationCenter';

export default function Header() {
  const { githubUser, discordUser, logout, isLoading } = useAuth();
  const [showGithubMenu, setShowGithubMenu] = useState(false);
  const [showDiscordMenu, setShowDiscordMenu] = useState(false);
  const [showVercelMenu, setShowVercMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-[#333333] backdrop-blur-sm bg-black/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* ===== LOGO SECTION ===== */}
          <a href="/" className="flex items-center gap-3">
            <img 
              src="/favicon.svg" 
              alt="Meridus Logo"
              className="w-8 h-8"
            />
            <span className="text-xl font-bold text-white" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>MERIDUS</span>
          </a>

          {/* ===== DESKTOP NAVIGATION ===== */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => {
              const href = `/${item.label.toLowerCase()}`;
              return (
                <Link
                  key={item.label}
                  href={href}
                  className="text-[#A1A1AA] hover:text-white font-medium transition-colors text-sm"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* ===== NOTIFICATION CENTER ===== */}
          <div className="hidden md:flex items-center">
            <NotificationCenter />
          </div>

          {/* ===== DESKTOP AUTH BUTTONS ===== */}
          <div className="hidden md:flex items-center gap-3">
            {/* GitHub */}
            <div className="relative">
              {githubUser ? (
                <>
                  <button
                    onClick={() => setShowGithubMenu(!showGithubMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border border-[#333333] hover:border-[#555555] text-white rounded-md transition-colors"
                  >
                    <img 
                      src={githubUser.avatar_url}
                      alt={githubUser.id.toString()}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm">{githubUser.login}</span>
                  </button>
                  {showGithubMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-[#333333] rounded-lg py-2 z-10">
                      <div className="px-4 py-2 border-b border-[#333333]">
                        <p className="text-sm font-semibold text-white">{githubUser.name}</p>
                        <p className="text-xs text-[#A1A1AA]">{githubUser.bio}</p>
                      </div>
                      <a 
                        href={`https://github.com/${githubUser.login}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-[#A1A1AA] hover:bg-[#1a1a1a] hover:text-white"
                      >
                        View Profile
                      </a>
                      <button
                        onClick={() => {
                          logout('github');
                          setShowGithubMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#A1A1AA] hover:bg-[#1a1a1a] hover:text-red-400"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '')}
                  className="px-4 py-2 bg-[#0a0a0a] border border-[#333333] hover:border-[#555555] text-white rounded-md transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </button>
              )}
            </div>

            {/* Discord */}
            <div className="relative">
              {discordUser ? (
                <>
                  <button
                    onClick={() => setShowDiscordMenu(!showDiscordMenu)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-md transition-colors"
                  >
                    {discordUser.avatar && (
                      <img 
                        src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
                        alt={discordUser.username}
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span className="text-sm">{discordUser.username}</span>
                  </button>
                  {showDiscordMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-[#333333] rounded-lg py-2 z-10">
                      <div className="px-4 py-2 border-b border-[#333333]">
                        <p className="text-sm font-semibold text-white">{discordUser.username}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout('discord');
                          setShowDiscordMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-[#A1A1AA] hover:bg-[#1a1a1a] hover:text-red-400"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleDiscordLogin(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '')}
                  className="px-4 py-2 bg-[#0070F3] hover:bg-[#0060df] text-white rounded-md transition-colors flex items-center gap-2 text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.046.046 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.052.052 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.03-.07 8.74 8.74 0 0 1-1.276-.08.05.05 0 0 1-.008-.025c.155-.201.304-.403.445-.607a11.29 11.29 0 0 1-1.546-1.56.05.05 0 0 1-.026-.054c.014-.026.017-.054.025-.082a11.566 11.566 0 0 0 3.664-1.776.046.046 0 0 1 .051-.03c.32.398.603.828.82 1.265a.05.05 0 0 1-.053.03 8.954 8.954 0 0 1-1.258.158.05.05 0 0 1-.008-.03c.21-.298.414-.595.597-.885a.05.05 0 0 1 .052-.01zm-3.397 1.414a.048.048 0 0 1 .052.01c.213.364.465.699.748 1.002a.048.048 0 0 1-.015.078 9.378 9.378 0 0 1-1.264.16.047.047 0 0 1-.054-.018 7.89 7.89 0 0 0-.605-.888.05.05 0 0 1 .015-.078 9.185 9.185 0 0 0 1.143-.146.048.048 0 0 1 .052.01zm2.004-1.918a.048.048 0 0 1 .053.01c.336.387.656.796.953 1.22a.047.047 0 0 1-.013.068 8.953 8.953 0 0 0-1.343-.18.047.047 0 0 1-.053-.019 7.115 7.115 0 0 1-.797-1.113.05.05 0 0 1 .044-.088zm2.041 1.225c.275-.16.533-.338.772-.508a.05.05 0 0 1 .058.019 8.88 8.88 0 0 0 .923-.234.05.05 0 0 1 .058.016c.255.21.494.438.716.677a.047.047 0 0 1-.014.073 9.228 9.228 0 0 1-.89.234.05.05 0 0 1-.048-.03c-.187-.188-.39-.353-.607-.492a.046.046 0 0 1-.017-.043c.003-.015.007-.03.015-.043z" />
                  </svg>
                  Discord
                </button>
              )}
            </div>

            {/* Vertical Separator */}
            <div className="w-px h-6 bg-[#333333] mx-1" title="Optional - Connect for Vercel deployments"></div>

            {/* Vercel (Optional) */}
            <div className="relative">
              <button
                onClick={() => handleVercelLogin(process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID || '')}
                className="px-4 py-2 bg-[#0a0a0a] border border-[#333333] hover:border-[#555555] text-white rounded-md transition-colors flex items-center gap-2 text-sm"
                title="Optional - Link Vercel for deployment status"
              >
                <svg className="w-5 h-5" viewBox="0 0 76 76" fill="currentColor">
                  <path d="M38.001 0L0 38.001l38.001 37.999 38-37.999L38.001 0zM38.002 27.587l19.045 19.043-19.045 19.046-19.045-19.046 19.045-19.043zM28.883 28.883L9.747 47.993l-6.04-6.035 19.137-19.075 6.039 6.04z" />
                </svg>
                Vercel
              </button>
            </div>
          </div>

          {/* ===== MOBILE HAMBURGER BUTTON ===== */}
          <button 
            className="md:hidden p-2 text-[#A1A1AA] hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* ===== MOBILE MENU ===== */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-slate-700 pt-4">
            <nav className="flex flex-col gap-3">
              {NAV_ITEMS.map((item) => {
                const href = `/${item.label.toLowerCase()}`;
                return (
                  <Link
                    key={item.label}
                    href={href}
                    className="text-slate-300 hover:text-white font-aldrich transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            
            <div className="flex flex-col gap-3 mt-4">
              {/* GitHub Mobile */}
              {githubUser ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 rounded-lg">
                  <img 
                    src={githubUser.avatar_url}
                    alt={githubUser.id.toString()}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-white">{githubUser.login}</span>
                  <button
                    onClick={() => {
                      logout('github');
                      setMobileMenuOpen(false);
                    }}
                    className="ml-auto text-sm text-red-400"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.91 1.187.092-.923.35-1.545.636-1.9-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.578.688.48C17.137 18.195 20 14.44 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </button>
              )}

              {/* Discord Mobile */}
              {discordUser ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-600 rounded-lg">
                  {discordUser.avatar && (
                    <img 
                      src={`https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`}
                      alt={discordUser.username}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <span className="text-sm text-white">{discordUser.username}</span>
                  <button
                    onClick={() => {
                      logout('discord');
                      setMobileMenuOpen(false);
                    }}
                    className="ml-auto text-sm text-red-300"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleDiscordLogin(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '')}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.046.046 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.052.052 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.03-.07 8.74 8.74 0 0 1-1.276-.08.05.05 0 0 1-.008-.025c.155-.201.304-.403.445-.607a11.29 11.29 0 0 1-1.546-1.56.05.05 0 0 1-.026-.054c.014-.026.017-.054.025-.082a11.566 11.566 0 0 0 3.664-1.776.046.046 0 0 1 .051-.03c.32.398.603.828.82 1.265a.05.05 0 0 1-.053.03 8.954 8.954 0 0 1-1.258.158.05.05 0 0 1-.008-.03c.21-.298.414-.595.597-.885a.05.05 0 0 1 .052-.01zm-3.397 1.414a.048.048 0 0 1 .052.01c.213.364.465.699.748 1.002a.048.048 0 0 1-.015.078 9.378 9.378 0 0 1-1.264.16.047.047 0 0 1-.054-.018 7.89 7.89 0 0 0-.605-.888.05.05 0 0 1 .015-.078 9.185 9.185 0 0 0 1.143-.146.048.048 0 0 1 .052.01zm2.004-1.918a.048.048 0 0 1 .053.01c.336.387.656.796.953 1.22a.047.047 0 0 1-.013.068 8.953 8.953 0 0 0-1.343-.18.047.047 0 0 1-.053-.019 7.115 7.115 0 0 1-.797-1.113.05.05 0 0 1 .044-.088zm2.041 1.225c.275-.16.533-.338.772-.508a.05.05 0 0 1 .058.019 8.88 8.88 0 0 0 .923-.234.05.05 0 0 1 .058.016c.255.21.494.438.716.677a.047.047 0 0 1-.014.073 9.228 9.228 0 0 1-.89.234.05.05 0 0 1-.048-.03c-.187-.188-.39-.353-.607-.492a.046.046 0 0 1-.017-.043c.003-.015.007-.03.015-.043z" />
                  </svg>
                  Discord
                </button>
              )}

              {/* Vercel Mobile (Optional) */}
              <button
                onClick={() => handleVercelLogin(process.env.NEXT_PUBLIC_VERCEL_CLIENT_ID || '')}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 76 76" fill="currentColor">
                  <path d="M38.001 0L0 38.001l38.001 37.999 38-37.999L38.001 0zM38.002 27.587l19.045 19.043-19.045 19.046-19.045-19.046 19.045-19.043zM28.883 28.883L9.747 47.993l-6.04-6.035 19.137-19.075 6.039 6.04z" />
                </svg>
                Vercel <span className="text-xs text-slate-400">(Optional)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
