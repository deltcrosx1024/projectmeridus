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
      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
        Github Monitoring Centre
      </h1>

      {/* ===== HERO DESCRIPTION ===== */}
      <p className="text-xl text-[#A1A1AA] mb-8 max-w-2xl leading-relaxed">
        Manage, monitor, and collaborate on your GitHub repositories all in one place. Connect with GitHub and streamline your development workflow.
      </p>

      {/* ===== HERO CTA BUTTONS ===== */}
      <div className="flex gap-4">
        {!isLoading && !githubUser && (
          <button 
            onClick={() => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '')}
            className="px-8 py-3 bg-[#0070F3] hover:bg-[#0060df] text-white font-semibold rounded-md transition-all"
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
