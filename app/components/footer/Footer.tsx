/**
 * Footer Component
 * Application footer with links and copyright information.
 * 
 * Features:
 * - Multiple footer sections (Product, Resources, Company, etc.)
 * - Dynamic footer links from data
 * - Copyright and legal links (Privacy, Terms)
 * - Responsive grid layout
 */
'use client';

import { FOOTER_SECTIONS } from '@/app/constants/data';

export default function Footer() {
  return (
    <footer className="border-t border-slate-700/50 bg-slate-900/50 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ===== FOOTER SECTIONS GRID ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>{section.title}</h3>
              <ul className="space-y-2 text-slate-400 text-sm" style={{ fontFamily: 'var(--font-archivo)' }}>
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-white transition">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== FOOTER BOTTOM ===== */}
        <div className="border-t border-slate-700/50 pt-8">
          <p className="text-slate-400 text-sm text-center" style={{ fontFamily: 'var(--font-archivo)' }}>
            © 2024 deltcrosx1024. All rights reserved. |{' '}
            <a href="#" className="hover:text-white transition">
              Privacy
            </a>{' '}
            |{' '}
            <a href="#" className="hover:text-white transition">
              Terms
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
