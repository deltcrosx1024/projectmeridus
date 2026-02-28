import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Octokit } from 'octokit';

/**
 * Discord Interactions Endpoint
 * POST /api/discord/interactions - Handle Discord interactions (slash commands, buttons, etc.)
 * GET  /api/discord/interactions - URL verification (returns PONG)
 *
 * Configure in Discord Developer Portal → Applications → Interactions Endpoint URL
 * URL: https://www.meridusdev.in.th/api/discord/interactions
 * Public Key: Set DISCORD_PUBLIC_KEY in env
 */

// Bot API Key for Discord bot to access website data
const BOT_API_KEY = process.env.MERIDUS_API_KEY;

// Handle GET requests (URL verification from Discord)
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Discord interactions endpoint is active. Use as Interaction Endpoint URL in Discord Developer Portal.'
  });
}

// Handle POST requests (Discord interactions)
export async function POST(request: Request) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();

  console.log('[Discord Interactions] Received request');

  // Handle empty body
  if (!body || body.trim() === '') {
    console.log('[Discord Interactions] Empty body received');
    return NextResponse.json({ error: 'Empty body' }, { status: 400 });
  }

  // Parse the body to check interaction type
  let interaction: Record<string, unknown> = {};
  try {
    interaction = JSON.parse(body);
  } catch (e) {
    console.log('[Discord Interactions] JSON parse error:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Handle PING (type: 1) - Discord sends this to verify the endpoint
  // According to Discord docs: respond with {"type": 1} immediately
  if (interaction.type === 1) {
    console.log('[Discord Interactions] Received PING - responding with PONG');
    return NextResponse.json({ type: 1 });
  }

  // For other interactions, verify the signature
  if (!signature || !timestamp) {
    console.log('[Discord Interactions] Missing signature headers');
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }

  // Verify Discord signature
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('[Discord Interactions] DISCORD_PUBLIC_KEY not set');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const isValid = verifyDiscordSignature(signature, timestamp, body, publicKey);
  if (!isValid) {
    console.log('[Discord Interactions] Invalid signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Handle the interaction based on its type
  try {
    // Handle APPLICATION_COMMAND (slash commands) - type 2
    if (interaction.type === 2) {
      const data = interaction.data as Record<string, unknown> | undefined;
      const commandName = data?.name as string | undefined;
      console.log(`[Discord Interactions] Slash command: ${commandName}`);

      // Example: /ping command
      if (commandName === 'ping') {
        return NextResponse.json({
          type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
          data: {
            content: '🏓 Pong!',
          },
        });
      }

      // Example: /hello command
      if (commandName === 'hello') {
        return NextResponse.json({
          type: 4,
          data: {
            content: '👋 Hello from Meridus!',
          },
        });
      }

      // Example: /status command - shows bot status
      if (commandName === 'status') {
        const botUrl = process.env.MERIDUS_BOT_URL || 'https://www.meridusdev.in.th';
        return NextResponse.json({
          type: 4,
          data: {
            content: `📊 **Meridus Bot Status**\n\n🌐 API URL: ${botUrl}\n✅ Status: Online\n🔒 HTTPS: Enabled`,
          },
        });
      }

      // Example: /repos command - fetches GitHub repositories
      if (commandName === 'repos') {
        try {
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            return NextResponse.json({
              type: 4,
              data: { content: '❌ GitHub token not configured on server.' },
            });
          }
          const octokit = new Octokit({ auth: githubToken });
          const res = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 5 });
          const repos = res.data.map(r => `• ${r.full_name} (⭐ ${r.stargazers_count})`).join('\n');
          return NextResponse.json({
            type: 4,
            data: {
              content: `📂 **Your GitHub Repositories:**\n${repos}`,
            },
          });
        } catch (err) {
          return NextResponse.json({
            type: 4,
            data: { content: `❌ Error fetching repos: ${err}` },
          });
        }
      }

      // Example: /issues command - fetches GitHub issues
      if (commandName === 'issues') {
        try {
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            return NextResponse.json({
              type: 4,
              data: { content: '❌ GitHub token not configured on server.' },
            });
          }
          const octokit = new Octokit({ auth: githubToken });
          const searchRes = await octokit.rest.search.issuesAndPullRequests({
            q: 'is:issue author:@me',
            per_page: 5,
          });
          const issues = searchRes.data.items?.map(i => `• ${i.title} (#${i.number})`).join('\n') || 'No issues found';
          return NextResponse.json({
            type: 4,
            data: {
              content: `🐛 **Your GitHub Issues:**\n${issues}`,
            },
          });
        } catch (err) {
          return NextResponse.json({
            type: 4,
            data: { content: `❌ Error fetching issues: ${err}` },
          });
        }
      }

      // Default response for unknown commands
      return NextResponse.json({
        type: 4,
        data: {
          content: `❌ Unknown command: ${commandName}`,
        },
      });
    }

    // Handle MESSAGE_COMPONENT (buttons, select menus) - type 3
    if (interaction.type === 3) {
      const data = interaction.data as Record<string, unknown> | undefined;
      const customId = data?.custom_id as string | undefined;
      console.log(`[Discord Interactions] Component interaction: ${customId}`);

      return NextResponse.json({
        type: 4,
        data: {
          content: `✅ You clicked: ${customId}`,
        },
      });
    }

    // Handle MODAL_SUBMIT (modal dialogs) - type 5
    if (interaction.type === 5) {
      const data = interaction.data as Record<string, unknown> | undefined;
      const customId = data?.custom_id as string | undefined;
      console.log(`[Discord Interactions] Modal submit: ${customId}`);

      return NextResponse.json({
        type: 4,
        data: {
          content: `📝 Modal submitted: ${customId}`,
        },
      });
    }

    console.log(`[Discord Interactions] Unhandled interaction type: ${interaction.type}`);
    return NextResponse.json({ error: 'Unhandled interaction type' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[Discord Interactions] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

/**
 * Verify Discord interaction signature using Ed25519
 */
function verifyDiscordSignature(
  signature: string,
  timestamp: string,
  body: string,
  publicKey: string
): boolean {
  try {
    const message = Buffer.from(timestamp + body);
    const sigBytes = Buffer.from(signature, 'hex');
    const keyBytes = Buffer.from(publicKey, 'hex');

    // Verify the signature
    const isValid = crypto.verify(
      undefined, // Let crypto deduce the algorithm from key type
      message,
      keyBytes,
      sigBytes
    );
    return isValid;
  } catch (err) {
    console.error('[Discord Interactions] Signature verification error:', err);
    return false;
  }
}
