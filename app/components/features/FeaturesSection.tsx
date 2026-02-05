/**
 * Features Section Component
 * Showcases product features in a responsive grid with feature cards.
 * 
 * Features:
 * - Responsive grid layout (1 col on mobile, 2 on tablet, 3 on desktop)
 * - Maps feature data to individual feature cards
 * - "Key Features" section heading
 */
'use client';

import { FEATURES_DATA } from '@/app/constants/data';
import FeatureCardComponent from './FeatureCard';

export default function FeaturesSection() {
  return (
    <div className="mb-16">
      {/* ===== FEATURES TITLE ===== */}
      <h2 className="text-3xl font-bold text-white mb-8" style={{ fontFamily: 'var(--font-aldrich)' }}>Key Features</h2>

      {/* ===== FEATURES GRID MAPPING ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FEATURES_DATA.map((feature) => (
          <FeatureCardComponent key={feature.id} feature={feature} />
        ))}
      </div>
    </div>
  );
}
