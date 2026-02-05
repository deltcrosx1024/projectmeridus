/**
 * Type Definitions
 * TypeScript interfaces and types used throughout the application.
 * Ensures type safety and consistency across components.
 */

/** Interface for individual statistics displayed in the stats grid */
// ===== STAT CARD TYPES =====
export interface StatCard {
  id: string;
  label: string;
  value: number | string;
  change: string;
  changeColor: 'green' | 'orange' | 'blue' | 'purple';
}

// ===== FEATURE CARD TYPES =====
export interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: 'blue' | 'cyan' | 'purple' | 'green' | 'orange' | 'pink';
}

// ===== FOOTER LINK TYPES =====
export interface FooterSection {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
}

// ===== NAVIGATION TYPES =====
export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
}
