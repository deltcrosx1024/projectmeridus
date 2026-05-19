/**
 * Footer Component
 * Application footer with links and copyright information.
 * 
 * Features:
 * - Multiple footer sections (Product, Resources, Company, etc.)
 * - Dynamic footer links from data
 * - Copyright and legal links (Privacy, Terms)
 * - Responsive grid layout
 * - Theme-aware logotypes (dark/light)
 */
'use client';

import { FOOTER_SECTIONS } from '@/app/constants/data';
import Image from 'next/image';
import { useTheme } from '@/app/contexts/ThemeContext'; // theme context import

export default function Footer() {
  const { resolvedTheme } = useTheme(); // resolvedTheme drives the footer theme mode
  const isDark = resolvedTheme === 'dark'; // derived boolean for conditional classes
  
  return (
    <footer className="border-t mt-16 border-[var(--card-border)] bg-[var(--background)]"> {/* footer background and border now use theme variables */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ===== FOOTER SECTIONS GRID ===== */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4 text-sm text-[var(--foreground)]">{section.title}</h3>
              <ul className="space-y-2 text-sm text-[var(--muted)]">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="transition text-sm hover:text-[var(--foreground)]">
                      {link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ===== FOOTER BOTTOM ===== */}
        <div className="border-t pt-8 border-[var(--card-border)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Copyright Section */}
            <div className="text-sm text-center md:text-left text-[var(--muted)]">
              <p className="mb-4">© 2024 deltcrosx1024. All rights reserved.</p>
              <div className="space-x-4">
                <a href="/privacy-policy" className="transition hover:text-[var(--foreground)]">
                  Privacy
                </a>
                <span className="mx-1">|</span>
                <a href="/terms-of-service" className="hover:text-[var(--foreground)] transition">
                  Terms
                </a>
                <span className="mx-1 border-[var(--card-border)]">|</span>
                <a href="/code-of-conduct" className="transition hover:text-[var(--foreground)]">
                  Code of Conduct
                </a>
              </div>
            </div>

            {/* Powered By Section */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-xs text-[var(--muted)]">Powered by</p> {/* powered-by text color switches on theme */}
                <div className="flex items-center gap-6 justify-center">
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer" title="Next.js">
                  <Image 
                    src={`/logotype/nextjs-logotype-${resolvedTheme}-background.svg`} 
                    width={80} 
                    height={32} 
                    alt="Next.js" 
                    className="h-6 w-auto hover:opacity-80 transition" 
                  /> {/* image source uses resolvedTheme for light/dark logotype */}
                </a>
                <a href="https://turbopack.dev" target="_blank" rel="noopener noreferrer" title="Turbopack">
                  <Image 
                    src={`/logotype/turbopack-logotype-${resolvedTheme}-background.svg`} 
                    width={80} 
                    height={32} 
                    alt="Turbopack" 
                    className="h-6 w-auto hover:opacity-80 transition" 
                  /> {/* image source uses resolvedTheme for light/dark logotype */}
                </a>
                <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" title="Vercel">
                  <Image 
                    src={`/logotype/vercel-logotype-${resolvedTheme}.svg`} 
                    width={80} 
                    height={32} 
                    alt="Vercel" 
                    className="h-6 w-auto hover:opacity-80 transition" 
                  /> {/* vercel logo source uses resolvedTheme */}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
