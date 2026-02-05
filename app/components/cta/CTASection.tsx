/**
 * Call-To-Action (CTA) Section Component
 * Prominent section encouraging users to sign up or get started.
 * 
 * Features:
 * - Gradient background (blue to cyan)
 * - Large headline and description
 * - Primary action button with shadow effect
 */
'use client';

export default function CTASection() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg p-12 text-center">
      {/* ===== CTA TITLE ===== */}
      <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>Ready to streamline your workflow?</h2>

      {/* ===== CTA DESCRIPTION ===== */}
      <p className="text-white/90 mb-8 max-w-2xl mx-auto" style={{ fontFamily: 'var(--font-archivo)' }}>
        Connect your GitHub account now and start managing your repositories with DevHub.
      </p>

      {/* ===== CTA BUTTON ===== */}
      <button className="px-10 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-slate-100 transition-all shadow-lg">
        Get Started Now
      </button>
    </div>
  );
}
