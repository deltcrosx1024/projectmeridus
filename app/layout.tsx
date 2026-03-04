/**
 * Root Layout Component
 * Provides the main HTML structure and global styling for the entire application.
 * Uses Next.js Metadata API for SEO configuration.
 */

import type { Metadata } from "next";
import { Geist_Mono, Aldrich, Archivo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SWRProvider } from "./components/swr-provider";
import CommandPaletteWrapper from "./components/command-palette/CommandPaletteWrapper";
import ToastContainer from "./components/toast/ToastContainer";
import MobileNav from "./components/mobile-nav/MobileNav";

const aldrich = Aldrich({
  weight: "400",
  variable: "--font-aldrich",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+JP&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Aldrich&display=swap" rel="stylesheet"></link>
        <link href="https://fonts.googleapis.com/css2?family=Archivo&display=swap" rel="stylesheet"></link>
      </head>
      <body
        className={`${aldrich.variable} ${archivo.variable} ${geistMono.variable}  antialiased`}
      >
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
