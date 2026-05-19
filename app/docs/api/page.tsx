'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold text-[var(--foreground)] mb-2"
            style={{ fontFamily: 'var(--font-aldrich)' }}
          >
            API Integration Guide
          </h1>
          <p className="text-[var(--muted)]" style={{ fontFamily: 'var(--font-archivo)' }}>
            Complete guide to integrating with our APIs
          </p>
        </div>

          <div className="prose max-w-none">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Overview
            </h2>
            <p className="text-[var(--muted)] mb-4">
              This guide provides comprehensive documentation for integrating with our GitHub and Discord API services.
              Our APIs allow you to authenticate users via OAuth2 and fetch data from their connected accounts.
            </p>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Authentication
            </h2>
            <p className="text-[var(--muted)] mb-4">
              We use OAuth 2.0 for authentication. Users can connect their GitHub or Discord accounts through our secure OAuth flow.
            </p>
            
            <h3 className="text-xl font-semibold text-white mb-2 mt-4">Supported Providers</h3>
            <ul className="list-disc list-inside text-[var(--muted)] space-y-2">
              <li><strong className="text-blue-400">GitHub</strong> - Access repositories, issues, and user data</li>
              <li><strong className="text-purple-400">Discord</strong> - Access server and user information</li>
            </ul>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              API Endpoints
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">GET /api/github/repos</h3>
                <p className="text-[var(--muted)] text-sm">Returns list of repositories for authenticated user</p>
                <div className="mt-2 bg-[var(--card-bg)] p-3 rounded text-[var(--foreground)] font-mono text-sm">
                  curl -H "Authorization: Bearer TOKEN" /api/github/repos
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">GET /api/github/issues</h3>
                <p className="text-[var(--muted)] text-sm">Returns issues from user repositories</p>
                <div className="mt-2 bg-[var(--card-bg)] p-3 rounded text-[var(--foreground)] font-mono text-sm">
                  curl -H "Authorization: Bearer TOKEN" /api/github/issues
                </div>
              </div>

              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-white">GET /api/github/commits</h3>
                <p className="text-slate-400 text-sm">Returns recent commits across all user repositories</p>
                <div className="mt-2 bg-slate-900 p-3 rounded text-green-400 font-mono text-sm">
                  curl -H "Authorization: Bearer TOKEN" /api/github/commits
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Environment Variables
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--card-border)]">
                    <th className="text-left py-2 px-3 text-[var(--foreground)]">Variable</th>
                    <th className="text-left py-2 px-3 text-[var(--foreground)]">Description</th>
                  </tr>
                </thead>
                <tbody className="text-[var(--muted)]">
                  <tr className="border-b border-[var(--card-border)]/50">
                    <td className="py-2 px-3 font-mono text-[var(--accent)]">GITHUB_CLIENT_ID</td>
                    <td className="py-2 px-3">Your GitHub OAuth App client ID</td>
                  </tr>
                  <tr className="border-b border-[var(--card-border)]/50">
                    <td className="py-2 px-3 font-mono text-[var(--accent)]">GITHUB_CLIENT_SECRET</td>
                    <td className="py-2 px-3">Your GitHub OAuth App client secret</td>
                  </tr>
                  <tr className="border-b border-[var(--card-border)]/50">
                    <td className="py-2 px-3 font-mono text-[var(--accent)]">DISCORD_CLIENT_ID</td>
                    <td className="py-2 px-3">Your Discord OAuth2 client ID</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-[var(--accent)]">DISCORD_CLIENT_SECRET</td>
                    <td className="py-2 px-3">Your Discord OAuth2 client secret</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg p-6">
            <h2 className="text-2xl font-bold text-[var(--foreground)] mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Rate Limits
            </h2>
            <p className="text-[var(--muted)]">
              Our API inherits rate limits from the OAuth providers. GitHub allows up to 5,000 requests per hour 
              for authenticated users. Discord has its own rate limiting based on endpoint types.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
