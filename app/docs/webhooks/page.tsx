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
              We support webhooks for GitHub events that are forwarded to Discord using the Bot API - no 
              webhook URLs needed!
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
                  Receive notifications for GitHub repository events and forward to Discord.
                </p>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-slate-300">
                  <p className="text-green-400 mb-2">POST /api/webhooks/services/github</p>
                  <p className="text-slate-500">Events: push, pull_request, issues, issue_comment, release</p>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Universal Webhook Forwarder</h3>
                <p className="text-slate-300 mb-3">
                  Forward messages to Discord or Slack using the Bot API.
                </p>
                <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-slate-300">
                  <p className="text-green-400 mb-2">POST /api/webhooks?service=discord</p>
                  <p className="text-slate-500">Query params: service=discord|slack, channel=CHANNEL_ID</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Dynamic Channel Selection
            </h2>
            <p className="text-slate-300 mb-4">
              The webhook system automatically determines where to send messages:
            </p>
            <ol className="list-decimal list-inside text-slate-300 space-y-2 mb-4">
              <li>If <code className="text-green-400">?channel=ID</code> is provided in the URL</li>
              <li>If <code className="text-green-400">DISCORD_CHANNEL_OWNER_REPO</code> env var is set for the repo</li>
              <li>Fallback: Bot automatically finds the first text channel in its server</li>
            </ol>
            <p className="text-slate-400 text-sm">
              This means you don't need to configure a default channel - just invite the bot and it will work!
            </p>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Setup GitHub Webhook
            </h2>
            <ol className="list-decimal list-inside text-slate-300 space-y-3">
              <li>Go to your GitHub repository → Settings → Webhooks</li>
              <li>Click "Add webhook"</li>
              <li>Payload URL: <code className="text-green-400">https://yourdomain.com/api/webhooks/services/github</code></li>
              <li>Content type: <code className="text-green-400">application/json</code></li>
              <li>Secret: <code className="text-green-400">GITHUB_WEBHOOK_SECRET</code> value from your env</li>
              <li>Select events you want to receive</li>
              <li>Click "Add webhook"</li>
            </ol>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Setup Discord Bot
            </h2>
            <ol className="list-decimal list-inside text-slate-300 space-y-3">
              <li>Go to <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Discord Developer Portal</a></li>
              <li>Create a new application and add a bot</li>
              <li>Copy the bot token and add to env: <code className="text-green-400">DISCORD_BOT_TOKEN</code></li>
              <li>Invite the bot to your server with appropriate permissions</li>
              <li>The bot will auto-discover a channel to send notifications</li>
            </ol>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Per-Repository Channels
            </h2>
            <p className="text-slate-300 mb-4">
              You can configure different Discord channels for different GitHub repositories:
            </p>
            <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
              <pre>{`# Environment variables format:
DISCORD_CHANNEL_OWNER_REPO=123456789

# Example:
DISCORD_CHANNEL_MYUSER_MYPROJECT=987654321
DISCORD_CHANNEL_OTHERUSER_OTHERPROJECT=555555555`}</pre>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Environment Variables
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-white">Variable</th>
                    <th className="text-left py-2 px-3 text-white">Required</th>
                    <th className="text-left py-2 px-3 text-white">Description</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-3 font-mono text-green-400">DISCORD_BOT_TOKEN</td>
                    <td className="py-2 px-3">Yes</td>
                    <td className="py-2 px-3">Your Discord bot token</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-3 font-mono text-green-400">GITHUB_WEBHOOK_SECRET</td>
                    <td className="py-2 px-3">Yes</td>
                    <td className="py-2 px-3">Secret for GitHub webhook verification</td>
                  </tr>
                  <tr className="border-b border-slate-700/50">
                    <td className="py-2 px-3 font-mono text-green-400">DISCORD_CHANNEL_*</td>
                    <td className="py-2 px-3">No</td>
                    <td className="py-2 px-3">Per-repo channel mapping (format: OWNER_REPO)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'var(--font-aldrich)' }}>
              Usage Examples
            </h2>
            
            <h4 className="text-lg font-semibold text-white mb-2">GitHub → Discord (automatic)</h4>
            <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-green-400 mb-4 overflow-x-auto">
              <pre>{`# Just configure GitHub webhook:
Payload URL: https://yoursite.com/api/webhooks/services/github
Secret: (your GITHUB_WEBHOOK_SECRET)

# Bot will auto-forward to Discord!`}</pre>
            </div>

            <h4 className="text-lg font-semibold text-white mb-2">Manual webhook call</h4>
            <div className="bg-slate-900 p-4 rounded-lg font-mono text-sm text-green-400 overflow-x-auto">
              <pre>{`curl -X POST "https://yoursite.com/api/webhooks?service=discord&channel=123456789" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Hello from webhook!"}'`}</pre>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
