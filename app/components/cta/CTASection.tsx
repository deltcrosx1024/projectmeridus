/**
 * Call-To-Action (CTA) Section Component
 * Prominent section encouraging users to sign up or get started.
 * 
 * Features:
 * - Dynamic content based on user authentication state
 * - Gradient background (blue to cyan)
 * - Large headline and description
 * - Context-aware action button
 * 
 * States:
 * - Not logged in: Generic signup CTA
 * - GitHub only: Discord invite CTA
 * - Discord only: GitHub connect CTA  
 * - Both logged in + bot in server: Welcome back / no CTA
 * - Both logged in + bot NOT in server: Invite bot CTA
 */
'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { handleGitHubLogin, handleDiscordLogin } from '@/app/lib/oauth';

export default function CTASection() {
  const { githubUser, discordUser, isLoading } = useAuth();
  const [hasBotInServer, setHasBotInServer] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if the bot is in the user's Discord server
    const checkBotStatus = async () => {
      const discordToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('discord_token='))
        ?.split('=')[1];

      if (!discordToken) {
        setHasBotInServer(false);
        return;
      }

      try {
        // Fetch user's guilds (servers)
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
          headers: {
            Authorization: `Bearer ${discordToken}`,
          },
        });

        if (!response.ok) {
          setHasBotInServer(false);
          return;
        }

        const guilds = await response.json();
        
        // Check if bot's guild ID is in user's guilds
        // This would be your bot's server ID - you'll need to set this env var
        const botGuildId = process.env.NEXT_PUBLIC_DISCORD_BOT_GUILD_ID;
        
        if (botGuildId) {
          const isInGuild = guilds.some((guild: { id: string }) => guild.id === botGuildId);
          setHasBotInServer(isInGuild);
        } else {
          // If no bot guild configured, assume not in server
          setHasBotInServer(false);
        }
      } catch (error) {
        console.error('Error checking bot status:', error);
        setHasBotInServer(false);
      }
    };

    if (discordUser) {
      checkBotStatus();
    } else {
      setHasBotInServer(false);
    }
  }, [discordUser]);

  // Determine CTA content based on auth state
  const getCTAContent = () => {
    // Not logged in to anything
    if (!githubUser && !discordUser) {
      return {
        title: 'Ready to streamline your workflow?',
        description: 'Connect your GitHub account now and start managing your repositories with DevHub.',
        buttonText: 'Get Started Now',
        buttonAction: () => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ''),
      };
    }

    // Logged into GitHub but NOT Discord
    if (githubUser && !discordUser) {
      return {
        title: 'Want to keep track on your work?',
        description: 'Login with Discord and invite our bot to receive notifications about your GitHub activity directly in your Discord server.',
        buttonText: 'Connect Discord & Invite Bot',
        buttonAction: () => handleDiscordLogin(process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || ''),
      };
    }

    // Logged into Discord but NOT GitHub
    if (discordUser && !githubUser) {
      return {
        title: 'Connect your repositories?',
        description: 'Login with GitHub to start managing your repositories and get insights into your coding activity.',
        buttonText: 'Connect GitHub',
        buttonAction: () => handleGitHubLogin(process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ''),
      };
    }

    // Logged into both
    if (githubUser && discordUser) {
      // Check if bot is in server
      if (hasBotInServer === true) {
        // Bot is in server - show welcome back or return null for no CTA
        return null;
      } else if (hasBotInServer === false) {
        // Bot not in server - prompt to invite
        return {
          title: 'Invite Our Bot to Your Server',
          description: 'Add our Discord bot to your server to receive real-time notifications about your GitHub activity.',
          buttonText: 'Invite Bot to Server',
          buttonAction: () => {
            const clientId = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
            const redirectUri = encodeURIComponent(globalThis.location.origin + '/api/auth/callback?service=discord');
            // Hybrid OAuth2: User login + Bot install in one flow
            // Requires response_type=code and redirect_uri for callback handling
            const inviteUrl = process.env.NEXT_PUBLIC_DISCORD_BOT_INVITE_URL || 
                `https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=8&response_type=code&redirect_uri=${redirectUri}&integration_type=0&scope=webhook.incoming+applications.commands+bot`;
              globalThis.location.href = inviteUrl;
          },
        };
      }
      // Loading state - show temporary content
      return {
        title: 'Welcome back!',
        description: 'Loading your dashboard...',
        buttonText: 'Go to Dashboard',
        buttonAction: () => globalThis.location.href = '/repositories',
      };
    }

    return null;
  };

  const ctaContent = getCTAContent();

  // Don't render CTA if content is null (e.g., user is fully set up)
  if (!ctaContent || isLoading) {
    return null;
  }

  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-12 text-center">
      {/* ===== CTA TITLE ===== */}
      <h2 
        className="text-3xl font-bold text-[var(--foreground)] mb-4" 
      >
        {ctaContent.title}
      </h2>

      {/* ===== CTA DESCRIPTION ===== */}
      <p 
        className="text-[var(--muted)] mb-8 max-w-2xl mx-auto" 
      >
        {ctaContent.description}
      </p>

      {/* ===== CTA BUTTON ===== */}
      <button
        onClick={ctaContent.buttonAction}
        className="px-10 py-3 bg-white text-black font-semibold rounded-md hover:bg-[#e5e5e5] transition-all"
      >
        {ctaContent.buttonText}
      </button>
    </div>
  );
}
