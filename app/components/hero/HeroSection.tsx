/**
 * Hero Section Component
 * Main headline section with introduction text and primary call-to-action buttons.
 * Features:
 * - Large responsive headline (h1)
 * - Subheading text
 * - Two action buttons (Connect GitHub & Learn More)
 */
'use client';
import { handleGitHubLogin, handleDiscordLogin } from '@/app/lib/oauth';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTheme } from '@/app/contexts/ThemeContext'; // theme context import
import { useState } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const { githubUser, discordUser, isLoading } = useAuth();
  const { resolvedTheme } = useTheme(); // resolvedTheme drives hero text theme
  const isDark = resolvedTheme === 'dark'; // theme boolean for hero text classes

  return (
    <div className="mb-16">
      {/* ===== HERO TITLE ===== */}
      <h1 className={`text-5xl md:text-6xl font-bold mb-4 leading-tight ${isDark ? 'text-white' : 'text-black'}`}>
        Github Monitoring Centre
      </h1> {/* hero title color switches based on theme */}

      {/* ===== HERO DESCRIPTION ===== */}
      <p className={`text-xl mb-8 max-w-2xl leading-relaxed ${isDark ? 'text-[#A1A1AA]' : 'text-gray-600'}`}>
        Manage, monitor, and collaborate on your GitHub repositories all in one place. Connect with GitHub and streamline your development workflow.
      </p> {/* hero description text color is theme-aware */}

      {/* ===== HERO CTA BUTTONS ===== */}
      <div className="flex gap-4">
        {!isLoading && !githubUser && (
          <button 
            onClick={() => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '')}
            className="px-8 py-3 bg-white text-black font-semibold rounded-md hover:bg-[#e5e5e5] transition-all"
          >
            Connect GitHub
          </button>
        )}
        {!isLoading && githubUser && (
          <div className="flex items-center gap-4">
            <span className="text-[#22c55e] font-semibold text-sm">
              ✓ Connected as {githubUser.login}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
