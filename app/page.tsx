/**
 * Home Page Component
 * Main landing page that displays all key sections:
 * - Header with navigation
 * - Hero section with call-to-action
 * - Statistics grid
 * - Features showcase
 * - GitHub Repos (if authenticated)
 * - Recent Issues (if authenticated)
 * - CTA section
 * - Footer
 */
'use client';

import Header from '@/app/components/header/Header';
import HeroSection from '@/app/components/hero/HeroSection';
import StatsGrid from '@/app/components/stats/StatsGrid';
import DiscordStatus from '@/app/components/discord-status/DiscordStatus';
import ApiMetrics from '@/app/components/api-metrics/ApiMetrics';
import InsightsSection from '@/app/components/insights/InsightsSection';
import CTASection from '@/app/components/cta/CTASection';
import Footer from '@/app/components/footer/Footer';
import ReposSection from '@/app/components/repos/ReposSection';
import IssuesSection from '@/app/components/issues/IssuesSection';
import PullRequestsSection from '@/app/components/pull-requests/PullRequestsSection';
import ActivityFeed from '@/app/components/activity/ActivityFeed';
import VercelDeployments from '@/app/components/vercel/VercelDeployments';
import { Analytics } from '@vercel/analytics/next';

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      <Analytics />
      {/* ===== HEADER COMPONENT ===== */}
      <Header />

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ===== HERO SECTION COMPONENT ===== */}
        <HeroSection />

        {/* ===== STATS GRID COMPONENT ===== */}
        <StatsGrid />

        {/* ===== API METRICS SECTION (Collapsed by default on main page) ===== */}
        <ApiMetrics defaultCollapsed={true} />

        {/* ===== DISCORD STATUS SECTION ===== */}
        <DiscordStatus />

        {/* ===== INSIGHTS SECTION (Activity Frequency & Latest Commits) ===== */}
        <InsightsSection />

        {/* ===== GITHUB REPOS SECTION ===== */}
        <ReposSection />

        {/* ===== PULL REQUESTS SECTION ===== */}
        <PullRequestsSection />

        {/* ===== RECENT ISSUES SECTION ===== */}
        <IssuesSection />

        {/* ===== ACTIVITY FEED SECTION ===== */}
        <ActivityFeed />

        {/* ===== VERCEL DEPLOYMENTS SECTION ===== */}
        <VercelDeployments />

        {/* ===== CTA SECTION COMPONENT ===== */}
        <CTASection />
      </main>

      {/* ===== FOOTER COMPONENT ===== */}
      <Footer />
    </div>
  );
}
