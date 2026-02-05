/**
 * Home Page Component
 * Main landing page that displays all key sections:
 * - Header with navigation
 * - Hero section with call-to-action
 * - Statistics grid
 * - Features showcase
 * - CTA section
 * - Footer
 */
'use client';

import Header from '@/app/components/header/Header';
import HeroSection from '@/app/components/hero/HeroSection';
import StatsGrid from '@/app/components/stats/StatsGrid';
import FeaturesSection from '@/app/components/features/FeaturesSection';
import CTASection from '@/app/components/cta/CTASection';
import Footer from '@/app/components/footer/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-950 dark:to-black">
      {/* ===== HEADER COMPONENT ===== */}
      <Header />

      {/* ===== MAIN CONTENT ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ===== HERO SECTION COMPONENT ===== */}
        <HeroSection />

        {/* ===== STATS GRID COMPONENT ===== */}
        <StatsGrid />

        {/* ===== FEATURES SECTION COMPONENT ===== */}
        <FeaturesSection />

        {/* ===== CTA SECTION COMPONENT ===== */}
        <CTASection />
      </main>

      {/* ===== FOOTER COMPONENT ===== */}
      <Footer />
    </div>
  );
}
