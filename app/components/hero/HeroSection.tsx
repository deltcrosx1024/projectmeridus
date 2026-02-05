/**
 * Hero Section Component
 * Main headline section with introduction text and primary call-to-action buttons.
 * Features:
 * - Large responsive headline (h1)
 * - Subheading text
 * - Two action buttons (Connect GitHub & Learn More)
 */
'use client';

export default function HeroSection() {
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
        <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all">
          Connect GitHub
        </button>
      </div>
    </div>
  );
}
