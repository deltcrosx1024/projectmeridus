/**
 * Root Layout Component
 * Provides the main HTML structure and global styling for the entire application.
 * Uses Next.js Metadata API for SEO configuration.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SWRProvider } from "./components/swr-provider";
import CommandPaletteWrapper from "./components/command-palette/CommandPaletteWrapper";
import ToastContainer from "./components/toast/ToastContainer";
import MobileNav from "./components/mobile-nav/MobileNav";
import { SpeedInsights } from "@vercel/speed-insights/next"

const sfProDisplay = localFont({
  src: [
    { path: './fonts/SF Pro/SF-Pro-Display-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/SF Pro/SF-Pro-Display-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/SF Pro/SF-Pro-Display-Semibold.otf', weight: '600', style: 'normal' },
    { path: './fonts/SF Pro/SF-Pro-Display-Bold.otf', weight: '700', style: 'normal' },
    { path: './fonts/SF Pro/SF-Pro-Display-RegularItalic.otf', weight: '400', style: 'italic' },
  ],
  variable: "--font-sf-pro",
  display: 'swap',
});

const sfMono = localFont({
  src: [
    { path: './fonts/SF Mono/SF-Mono-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/SF Mono/SF-Mono-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/SF Mono/SF-Mono-Semibold.otf', weight: '600', style: 'normal' },
    { path: './fonts/SF Mono/SF-Mono-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: "--font-sf-mono",
  display: 'swap',
});

const aldrich = localFont({
  src: [{ path: './fonts/SF Pro/SF-Pro-Display-Bold.otf', weight: '700', style: 'normal' }],
  variable: "--font-aldrich",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "DeltCrosX DevHub",
  description: "Development Hub and Productivity Tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body
        className={`${sfProDisplay.variable} ${sfMono.variable} ${aldrich.variable} antialiased`}
      >
        <SpeedInsights />
        <AuthProvider>
          <SettingsProvider>
            <ThemeProvider>
              <LanguageProvider>
                <SWRProvider>
                {children}
                <CommandPaletteWrapper />
                <ToastContainer />
                <MobileNav />
                </SWRProvider>
              </LanguageProvider>
            </ThemeProvider>
          </SettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
