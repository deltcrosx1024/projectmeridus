'use client';

import Header from '@/app/components/header/Header';
import Footer from '@/app/components/footer/Footer';

export default function WebhooksDocsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold text-white mb-2"
            style={{ fontFamily: 'var(--font-aldrich)' }}
          >
            Webhooks Guide
          </h1>
          <p className="text-slate-400" style={{ fontFamily: 'var(--font-archivo)' }}>
            Learn how to set up and use webhooks for real-time events
          </p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none">
          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Overview
            </h2>
            <p className="text-slate-300 mb-4">
              Webhooks allow you to receive real-time notifications when specific events occur. 
              We support webhooks for both GitHub and Discord events, enabling you to build 
              reactive integrations.
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Available Webhooks
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">GitHub Webhooks</h3>
                <p className="text-slate-300 mb-3">
                  Receive notifications for GitHub repository events like issues, pull requests, and pushes.
                </p>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-slate-300">
                  <p className="text-green-400 mb-2">POST /api/webhooks/services/github</p>
                  <p className="text-slate-500">Events: issues, push, pull_request</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Discord Webhooks</h3>
                <p className="text-slate-300 mb-3">
                  Send notifications to Discord channels when events occur.
                </p>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-slate-300">
                  <p className="text-green-400 mb-2">POST /api/webhooks/services/discord</p>
                  <p className="text-slate-500">Events: message, reaction, member</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Payload Structure
            </h2>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">GitHub Issue Event</h4>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
                  <pre>{`{
  "action": "opened",
  "issue": {
    "number": 1,
    "title": "Bug report",
    "body": "Description",
    "state": "open"
  },
  "repository": {
    "name": "my-repo",
    "full_name": "user/my-repo"
  },
  "sender": {
    "login": "username",
    "avatar_url": "https://..."
  }
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Discord Message Event</h4>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
                  <pre>{`{
  "type": "message",
  "channel_id": "123456789",
  "message": {
    "id": "987654321",
    "content": "Hello world",
    "author": {
      "id": "user123",
      "username": "user"
    }
  }
}`}</pre>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Security
            </h2>
            <p className="text-slate-300 mb-4">
              All webhook requests include a signature header for verification. You should validate 
              this signature to ensure the request is legitimate.
            </p>
            <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-green-400">
              <p className="mb-2">// Verify webhook signature</p>
              <p>X-Hub-Signature-256: sha256={"<"}signature{" >"}</p>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Environment Variables
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-white">Variable</th>
                    <th className="text-left py-2 px-3 text-white">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-3 font-mono text-green-400">WEBHOOK_SECRET</td>
                    <td className="py-2 px-3">Secret key for webhook signature verification</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-3 font-mono text-green-400">DISCORD_WEBHOOK_URL</td>
                    <td className="py-2 px-3">Discord webhook URL for sending messages</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
