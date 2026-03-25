'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';

interface DocSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
    const hash = window.location.hash.replace('#', '');
    if (hash && sections.some(s => s.id === hash)) {
      setActiveSection(hash);
    }
  }, []);

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
  };

  const sections: DocSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            Welcome to Meridus! This guide will walk you through setting up and using the platform from scratch.
            Think of this as your onboarding journey - we'll build up your understanding step by step.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">What is Meridus?</h3>
          <p className="text-[#A1A1AA] mb-6">
            Meridus is a developer dashboard that brings together your GitHub, Discord, and Vercel accounts 
            into one unified interface. Instead of checking multiple dashboards, you get a centralized view of:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li>Your GitHub repositories, issues, and pull requests</li>
            <li>Real-time Discord service status (is Discord down right now?)</li>
            <li>Your Vercel deployment status</li>
            <li>API response times for all integrated services</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mb-4">Prerequisites</h3>
          <p className="text-[#A1A1AA] mb-4">
            Before using Meridus, you'll need accounts with these services:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><strong className="text-white">GitHub</strong> - Required for repository data</li>
            <li><strong className="text-white">Discord</strong> - Optional, for status viewing</li>
            <li><strong className="text-white">Vercel</strong> - Optional, for deployment tracking</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of empty/homepage state here */}
          {/* TODO: Add screenshot showing what the homepage looks like before connecting any accounts */}
        </>
      ),
    },
    {
      id: 'connecting-accounts',
      title: 'Connecting Your Accounts',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            Now let's connect your accounts. Think of this like logging into different services - 
            Meridus uses OAuth (the same standard used by "Login with Google" buttons everywhere) to securely connect.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Connecting GitHub (Required)</h3>
          <p className="text-[#A1A1AA] mb-4">
            GitHub is the core of Meridus - without it, there's not much to show. Here's how to connect:
          </p>
          <ol className="list-decimal list-inside text-[#A1A1AA] mb-6 space-y-3">
            <li>Look for the <span className="text-white">GitHub</span> button in the top right of the header</li>
            <li>Click it - you'll be redirected to GitHub's authorization page</li>
            <li>Review the permissions Meridus is requesting (just read-only access to your repos)</li>
            <li>Click "Authorize" to grant access</li>
            <li>You'll be redirected back to Meridus, now logged in!</li>
          </ol>

          {/* IMAGE PLACEHOLDER: Add screenshot of GitHub OAuth consent screen */}
          {/* TODO: Add screenshot showing GitHub's OAuth consent screen */}

          <div className="bg-[#151515] border border-[#333333] rounded-lg p-4 mb-6">
            <h4 className="text-white font-semibold mb-2">Why does Meridus need these permissions?</h4>
            <p className="text-[#A1A1AA] text-sm">
              Meridus only requests "read" access to your repositories - it can't modify your code or push anything.
              The permissions let us show your repos, issues, and pull requests on your dashboard.
              We never store your password; OAuth tokens are encrypted and stored securely.
            </p>
          </div>

          <h3 className="text-xl font-semibold text-white mb-4">Connecting Discord (Optional)</h3>
          <p className="text-[#A1A1AA] mb-4">
            Connecting Discord lets you see real-time status of Discord's services - super useful 
            when Discord is acting up and you want to know if it's just you or everyone.
          </p>
          <ol className="list-decimal list-inside text-[#A1A1AA] mb-6 space-y-3">
            <li>Click the <span className="text-white">Discord</span> button in the header</li>
            <li>Authorize the app (we only need basic permissions)</li>
            <li>Done! You'll now see Discord status on your dashboard</li>
          </ol>

          {/* IMAGE PLACEHOLDER: Add screenshot of Discord status section */}
          {/* TODO: Add screenshot showing the Discord status component displaying various services */}

          <h3 className="text-xl font-semibold text-white mb-4">Connecting Vercel (Optional)</h3>
          <p className="text-[#A1A1AA] mb-4">
            Vercel integration shows your deployments directly on the dashboard. 
            If you deploy to Vercel, this is super handy to see if your latest deploy succeeded or failed.
          </p>
          <ol className="list-decimal list-inside text-[#A1A1AA] mb-6 space-y-3">
            <li>Click the <span className="text-white">Vercel</span> button in the header</li>
            <li>Log into your Vercel account if not already</li>
            <li>Authorize Meridus to read your deployments</li>
            <li>Boom - deployment status now appears on your dashboard</li>
          </ol>

          {/* IMAGE PLACEHOLDER: Add screenshot of Vercel deployments section */}
          {/* TODO: Add screenshot showing the Vercel deployments component */}
        </>
      ),
    },
    {
      id: 'understanding-dashboard',
      title: 'Understanding the Dashboard',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            Once you've connected your accounts, the dashboard comes alive. Let's break down each section 
            so you know what you're looking at.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Stats Grid (The Top Cards)</h3>
          <p className="text-[#A1A1AA] mb-4">
            The four cards at the top give you a quick snapshot:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><strong className="text-white">Total Repositories</strong> - How many repos you have (both public)</li>
            <li><strong className="text-white">Active Issues</strong> - Issues currently open across all your repos</li>
            <li><strong className="text-white">Pull Requests</strong> - Open PRs waiting for review or merge</li>
            <li><strong className="text-white">Followers</strong> - Your GitHub followers (community size indicator)</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of stats grid */}
          {/* TODO: Add screenshot showing the stats grid with real numbers */}

          <h3 className="text-xl font-semibold text-white mb-4">API Response Times (Expandable)</h3>
          <p className="text-[#A1A1AA] mb-4">
            This section shows how fast Meridus can reach each external service. 
            It's collapsed by default (click "Expand" to see it) because it's mostly useful for debugging.
          </p>
          <p className="text-[#A1A1AA] mb-4">
            The chart shows response times in milliseconds (lower is better!):
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><span className="text-green-400">Green</span> - Under 200ms (great!)</li>
            <li><span className="text-orange-400">Orange</span> - 200-500ms (acceptable)</li>
            <li><span className="text-red-400">Red</span> - Over 500ms (slow - might indicate issues)</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of API metrics chart */}
          {/* TODO: Add screenshot showing the Highcharts response time visualization */}

          <h3 className="text-xl font-semibold text-white mb-4">Discord Status</h3>
          <p className="text-[#A1A1AA] mb-4">
            This shows the current operational status of Discord's various services. 
            You don't need to be logged into Discord to see this - it's public data from Discord's status page.
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><strong className="text-white">API</strong> - Core messaging and user operations</li>
            <li><strong className="text-white">Gateway</strong> - Real-time connections (voice, presence)</li>
            <li><strong className="text-white">Media Proxy</strong> - Image/video hosting</li>
            <li><strong className="text-white">Search</strong> - Message search functionality</li>
            <li>And more services... the status updates every 15 seconds!</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of Discord status panel */}
          {/* TODO: Add screenshot showing Discord status component with colored indicators */}
        </>
      ),
    },
    {
      id: 'insights-page',
      title: 'Using the Insights Page',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            The Insights page is like a yearly report card for your GitHub activity - 
            but you can see it anytime! This page requires GitHub to be connected.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">What's on the Insights Page?</h3>

          <h4 className="text-lg font-medium text-white mb-3">Contribution Graph</h4>
          <p className="text-[#A1A1AA] mb-4">
            Remember GitHub's contribution calendar? Meridus shows yours here. 
            Each square represents a day, and the color intensity shows how active you were.
            Darker green = more contributions that day.
          </p>

          {/* IMAGE PLACEHOLDER: Add screenshot of contribution graph */}
          {/* TODO: Add screenshot showing the contribution graph with real data */}

          <h4 className="text-lg font-medium text-white mb-3">Repository Stats</h4>
          <p className="text-[#A1A1AA] mb-4">
            Below the graph, you'll see stats cards showing:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li>Total Repositories you own</li>
            <li>Total Stars across all repos</li>
            <li>Total Forks</li>
            <li>Your follower count</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of repository stats */}
          {/* TODO: Add screenshot showing repository statistics cards */}

          <h4 className="text-lg font-medium text-white mb-3">Top Repositories</h4>
          <p className="text-[#A1A1AA] mb-4">
            A sorted list of your repos by star count. Click any repo to go directly to it on GitHub.
          </p>

          {/* IMAGE PLACEHOLDER: Add screenshot of top repositories list */}
          {/* TODO: Add screenshot showing top repositories sorted by stars */}

          <h3 className="text-xl font-semibold text-white mb-4">API & Status Section</h3>
          <p className="text-[#A1A1AA] mb-4">
            At the top of the Insights page, you'll find the API Response Times chart and Discord Status - 
            fully expanded so you can see everything at once. This is especially useful for monitoring!
          </p>

          {/* IMAGE PLACEHOLDER: Add screenshot of API and status section on Insights */}
          {/* TODO: Add screenshot showing the expanded API metrics and Discord status on Insights page */}
        </>
      ),
    },
    {
      id: 'repositories-page',
      title: 'Repositories Page',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            The Repositories page shows all your GitHub repositories in a clean list view. 
            Think of it as a more visual version of your GitHub repos page.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">What Information is Shown?</h3>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><strong className="text-white">Repository Name</strong> - Click to open on GitHub</li>
            <li><strong className="text-white">Description</strong> - What the repo is about</li>
            <li><strong className="text-white">Language</strong> - Primary language (JavaScript, Python, etc.)</li>
            <li><strong className="text-white">Stars & Forks</strong> - Popularity metrics</li>
            <li><strong className="text-white">Last Updated</strong> - When the repo was last modified</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of repositories page */}
          {/* TODO: Add screenshot showing the repositories list with all columns */}

          <h3 className="text-xl font-semibold text-white mb-4">How to Use It</h3>
          <p className="text-[#A1A1AA] mb-4">
            Browse through your repos, see which ones are active, and click any repo name 
            to open it directly in GitHub. It's a quick way to get an overview of all your projects.
          </p>
        </>
      ),
    },
    {
      id: 'settings-page',
      title: 'Settings Page',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            The Settings page lets you customize how Meridus behaves. 
            It's your control center for preferences.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Auto-Refresh</h3>
          <p className="text-[#A1A1AA] mb-4">
            By default, Meridus automatically refreshes your data every 5 minutes. 
            You can adjust this or turn it off entirely:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><strong className="text-white">Enable/Disable</strong> - Turn auto-refresh on or off</li>
            <li><strong className="text-white">Refresh Interval</strong> - How often (1-30 minutes)</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of settings page auto-refresh options */}
          {/* TODO: Add screenshot showing auto-refresh settings controls */}

          <h3 className="text-xl font-semibold text-white mb-4">Theme</h3>
          <p className="text-[#A1A1AA] mb-4">
            Currently, Meridus supports dark mode (and it's the default - easier on the eyes for developers!).
            Light mode support is coming soon.
          </p>

          {/* IMAGE PLACEHOLDER: Add screenshot of theme settings */}
          {/* TODO: Add screenshot showing theme selector */}

          <h3 className="text-xl font-semibold text-white mb-4">Notifications</h3>
          <p className="text-[#A1A1AA] mb-4">
            Want to know when something important happens? Set up notifications here.
            (This feature is being expanded - check back soon!)
          </p>
        </>
      ),
    },
    {
      id: 'discord-bot',
      title: 'Discord Bot',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            Meridus isn't just a dashboard - it includes a Discord bot that can interact with your server!
            This section explains what the bot does and how to add it.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">What Can the Bot Do?</h3>
          <p className="text-[#A1A1AA] mb-4">
            The Meridus bot can:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><strong className="text-white">Respond to commands</strong> - Slash commands for various actions</li>
            <li><strong className="text-white">Webhook integration</strong> - Receive events from GitHub, Vercel, etc.</li>
            <li><strong className="text-white">Send notifications</strong> - Post updates to your server channels</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of bot in action on Discord */}
          {/* TODO: Add screenshot showing the bot responding to a command in Discord */}

          <h3 className="text-xl font-semibold text-white mb-4">Adding the Bot to Your Server</h3>
          <p className="text-[#A1A1AA] mb-4">
            To add the Meridus bot to your Discord server:
          </p>
          <ol className="list-decimal list-inside text-[#A1A1AA] mb-6 space-y-3">
            <li>Get the bot invite link from the settings or docs (coming soon!)</li>
            <li>Choose which server to add it to</li>
            <li>Review permissions - make sure it has the access it needs</li>
            <li>Click "Authorize" and the bot will join your server!</li>
          </ol>

          <div className="bg-[#151515] border border-[#333333] rounded-lg p-4 mb-6">
            <h4 className="text-white font-semibold mb-2">Important Permissions</h4>
            <p className="text-[#A1A1AA] text-sm">
              The bot needs certain permissions to function: Send Messages, Read Message History, 
              and Use Slash Commands. Don't worry - we'll only ask for what we need!
            </p>
          </div>

          <h3 className="text-xl font-semibold text-white mb-4">Bot Commands</h3>
          <p className="text-[#A1A1AA] mb-4">
            Once the bot is in your server, you can use these slash commands:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li><code className="bg-[#1a1a1a] px-2 py-1 rounded text-green-400">/help</code> - Show available commands</li>
            <li><code className="bg-[#1a1a1a] px-2 py-1 rounded text-green-400">/status</code> - Check Discord API status</li>
            <li><code className="bg-[#1a1a1a] px-2 py-1 rounded text-green-400">/ping</code> - Check bot responsiveness</li>
          </ul>

          {/* IMAGE PLACEHOLDER: Add screenshot of slash commands list in Discord */}
          {/* TODO: Add screenshot showing available slash commands in Discord */}

          <h3 className="text-xl font-semibold text-white mb-4">Setting Up Webhooks</h3>
          <p className="text-[#A1A1AA] mb-4">
            For GitHub or Vercel events to post to your Discord server, you'll need to set up webhooks.
            This is a bit more advanced - check the Webhooks section in API docs for detailed instructions.
          </p>
        </>
      ),
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: (
        <>
          <p className="text-[#A1A1AA] mb-6">
            Uh oh! Something's not working. Don't worry - we'll help you figure it out.
            Here are common issues and how to fix them.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">"Not authenticated" Errors</h3>
          <p className="text-[#A1A1AA] mb-2">
            <strong className="text-white">Symptoms:</strong> You're trying to view something but get an error saying you need to log in.
          </p>
          <p className="text-[#A1A1AA] mb-4">
            <strong className="text-white">Fix:</strong> Make sure you've connected the relevant account (GitHub for repos, Discord for status, etc.).
            Check the header - if you don't see your profile picture, you're not logged in.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Data Not Loading</h3>
          <p className="text-[#A1A1AA] mb-2">
            <strong className="text-white">Symptoms:</strong> The page just spins or shows loading forever.
          </p>
          <p className="text-[#A1A1AA] mb-4">
            <strong className="text-white">Fix:</strong> Try these steps:
          </p>
          <ol className="list-decimal list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li>Refresh the page (F5 or the refresh button)</li>
            <li>Check your internet connection</li>
            <li>Check if GitHub/Vercel/Discord APIs are having issues</li>
            <li>Try logging out and logging back in</li>
          </ol>

          <h3 className="text-xl font-semibold text-white mb-4">Slow Response Times</h3>
          <p className="text-[#A1A1AA] mb-2">
            <strong className="text-white">Symptoms:</strong> The API metrics show red (over 500ms) consistently.
          </p>
          <p className="text-[#A1A1AA] mb-4">
            <strong className="text-white">Fix:</strong> This is usually on our end or the external service's end:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li>Check GitHub's status at status.github.com</li>
            <li>Check Vercel's status at vercel.status.site</li>
            <li>Check Discord's status (we show this on the dashboard!)</li>
          </ul>

          <h3 className="text-xl font-semibold text-white mb-4">Bot Not Responding</h3>
          <p className="text-[#A1A1AA] mb-2">
            <strong className="text-white">Symptoms:</strong> You typed a command but nothing happens.
          </p>
          <p className="text-[#A1A1AA] mb-4">
            <strong className="text-white">Fix:</strong> 
          </p>
          <ol className="list-decimal list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li>Make sure the bot is actually in your server (check the member list)</li>
            <li>Try using the command in a different channel</li>
            <li>Re-invite the bot from our portal</li>
            <li>Check that the bot has proper permissions</li>
          </ol>

          <h3 className="text-xl font-semibold text-white mb-4">Still Stuck?</h3>
          <p className="text-[#A1A1AA] mb-4">
            If none of these help, here's what to do:
          </p>
          <ul className="list-disc list-inside text-[#A1A1AA] mb-6 space-y-2">
            <li>Check our GitHub Issues page - someone might have reported the same thing</li>
            <li>Join our Discord server and ask in #support</li>
            <li>Email us at contact@meridus.dev with details about what's happening</li>
          </ul>
        </>
      ),
    },
    {
      id: 'faq',
      title: 'FAQ',
      content: (
        <>
          <h3 className="text-xl font-semibold text-white mb-4">Is Meridus free?</h3>
          <p className="text-[#A1A1AA] mb-6">
            Yes! Meridus is completely free for now. We're still figuring out future monetization, 
            but the core features will always have a free tier.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Is my data secure?</h3>
          <p className="text-[#A1A1AA] mb-6">
            We take security seriously. Your OAuth tokens are encrypted and we never store passwords.
            We only request the minimum permissions needed. Check our Privacy Policy for details.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Why do you need access to my repositories?</h3>
          <p className="text-[#A1A1AA] mb-6">
            To show your repos, issues, and PRs on the dashboard, we need read access. 
            We can't modify your code or change any settings - that's by design.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Can I use Meridus without connecting all three services?</h3>
          <p className="text-[#A1A1AA] mb-6">
            Absolutely! GitHub is the only required one (it's the core of the app). 
            Discord and Vercel are optional - connect them only if you want those features.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">How often is the data refreshed?</h3>
          <p className="text-[#A1A1AA] mb-6">
            By default, data refreshes every 5 minutes. You can change this in Settings - 
            options range from 1 minute to 30 minutes, or turn off auto-refresh entirely.
            Discord status updates every 15 seconds!
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">The bot isn't working in my server</h3>
          <p className="text-[#A1A1AA] mb-6">
            Make sure the bot has proper permissions and was invited correctly. 
            Try removing and re-inviting it. If issues persist, check the Troubleshooting section or contact us.
          </p>

          <h3 className="text-xl font-semibold text-white mb-4">Can I suggest new features?</h3>
          <p className="text-[#A1A1AA] mb-6">
            Of course! We'd love to hear what you'd like to see. 
            Open an issue on our GitHub repo or reach out directly. 
            We're building this for the community, so your input matters!
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Documentation
          </h1>
          <p className="text-[#A1A1AA]">
            Everything you need to know about using Meridus
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {!isHydrated ? (
                <div className="animate-pulse space-y-2">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="h-10 bg-[#1a1a1a] rounded-lg"></div>
                  ))}
                </div>
              ) : (
                sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-[#0070F3] text-white'
                        : 'text-[#A1A1AA] hover:bg-[#1a1a1a] hover:text-white'
                    }`}
                  >
                    {section.title}
                  </button>
                ))
              )}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0">
            {!isHydrated ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-[#1a1a1a] rounded w-1/3"></div>
                <div className="h-4 bg-[#1a1a1a] rounded w-full"></div>
                <div className="h-4 bg-[#1a1a1a] rounded w-5/6"></div>
                <div className="h-4 bg-[#1a1a1a] rounded w-4/5"></div>
              </div>
            ) : (
              sections.map((section) => (
                <div
                  key={section.id}
                  className={activeSection === section.id ? 'block' : 'hidden'}
                >
                  <h2 className="text-3xl font-bold text-white mb-6">{section.title}</h2>
                  <div className="prose prose-invert max-w-none">
                    {section.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}