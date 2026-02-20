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
import { useState } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const { githubUser, discordUser, isLoading } = useAuth();

  return (
    <div className="mb-16">
      {/* ===== HERO TITLE ===== */}
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: 'var(--font-aldrich)' }}>
        Github Monitoring Centre
      </h1>

      {/* ===== HERO DESCRIPTION ===== */}
      <p className="text-xl text-slate-300 mb-8 max-w-2xl" style={{ fontFamily: 'var(--font-archivo)' }}>
        Manage, monitor, and collaborate on your GitHub repositories all in one place. Connect with GitHub and streamline your development workflow.
      </p>

      {/* ===== HERO CTA BUTTONS ===== */}
      <div className="flex gap-4">
        {!isLoading && !githubUser && (
          <button 
            onClick={() => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '')}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Connect GitHub
          </button>
        )}
        {!isLoading && githubUser && (
          <div className="flex items-center gap-4">
            <span className="text-green-400 font-semibold">
              ✓ Connected as {githubUser.login}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
