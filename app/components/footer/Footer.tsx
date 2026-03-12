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
    <footer className="border-t border-[#333333] bg-black mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ===== FOOTER SECTIONS GRID ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4 text-sm">{section.title}</h3>
              <ul className="space-y-2 text-[#A1A1AA] text-sm">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="hover:text-white transition text-sm">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== FOOTER BOTTOM ===== */}
        <div className="border-t border-[#333333] pt-8">
          <p className="text-[#A1A1AA] text-sm text-center">
            © 2024 deltcrosx1024. All rights reserved.{' '}
            <span className="hidden sm:inline">|{' '}</span>
            <br className="sm:hidden" />
            <a href="/privacy-policy" className="hover:text-white transition">
              Privacy
            </a>{' '}
            <span className="mx-1">|</span>{' '}
            <a href="/terms-of-service" className="hover:text-white transition">
              Terms
            </a>
            <span className="mx-1">|</span>{' '}
            <a href="/code-of-conduct" className="hover:text-white transition">
              Code of Conduct
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
