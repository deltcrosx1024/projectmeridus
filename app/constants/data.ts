/**
 * Data Constants
 * Central location for all static data used throughout the application.
 * Includes stats, features, navigation items, and footer information.
 */

import { StatCard, FeatureCard, FooterSection } from '@/app/types';

/** Statistics displayed in the stats grid section */
// ===== STATS DATA =====
export const STATS_DATA: StatCard[] = [
  {
    id: 'repositories',
    label: 'Total Repositories',
    value: 0,
    change: '+0 this month',
    changeColor: 'green',
  },
  {
    id: 'issues',
    label: 'Active Issues',
    value: 0,
    change: 'Needs attention',
    changeColor: 'orange',
  },
  {
    id: 'pullRequests',
    label: 'Pull Requests',
    value: 0,
    change: 'In progress',
    changeColor: 'blue',
  },
  {
    id: 'collaborators',
    label: 'Collaborators',
    value: 0,
    change: 'Team members',
    changeColor: 'purple',
  },
];

/** Feature cards showcasing product capabilities */
// ===== FEATURES DATA =====
export const FEATURES_DATA: FeatureCard[] = [
  {
    id: 'repo-management',
    title: 'Repository Management',
    description: 'Organize and manage all your GitHub repositories in a single dashboard with advanced filtering and search.',
    icon: 'settings',
    color: 'blue',
  },
  {
    id: 'real-time-insights',
    title: 'Real-time Insights',
    description: 'Get instant analytics and metrics about your repositories, commits, and contributions at a glance.',
    icon: 'chart',
    color: 'cyan',
  },
  {
    id: 'team-collaboration',
    title: 'Team Collaboration',
    description: 'Collaborate seamlessly with your team members and manage pull requests directly from the dashboard.',
    icon: 'users',
    color: 'purple',
  },
  {
    id: 'fast-responsive',
    title: 'Fast & Responsive',
    description: 'Experience lightning-fast performance with real-time updates and instant GitHub API integrations.',
    icon: 'lightning',
    color: 'green',
  },
  {
    id: 'secure-integration',
    title: 'Secure Integration',
    description: 'Enterprise-grade security with OAuth2 authentication and safe GitHub API token management.',
    icon: 'lock',
    color: 'orange',
  },
  {
    id: 'customizable',
    title: 'Customizable',
    description: 'Personalize your dashboard with custom themes, layouts, and notification preferences.',
    icon: 'lightbulb',
    color: 'pink',
  },
];

/** Footer section structure with links */
// ===== FOOTER SECTIONS DATA =====
export const FOOTER_SECTIONS: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#' },
      { label: 'Pricing', href: '#' },
      { label: 'Security', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '/docs/api' },
      { label: 'API Reference', href: '/docs/webhooks' },
      { label: 'Blog', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Support', href: '#' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'GitHub', href: '#' },
      { label: 'Twitter', href: '#' },
      { label: 'Discord', href: '#' },
    ],
  },
];

/** Navigation menu items for header */
// ===== NAVIGATION DATA =====
export const NAV_ITEMS = [
  { label: 'Repositories' },
  { label: 'Insights' },
  { label: 'Settings' },
];
