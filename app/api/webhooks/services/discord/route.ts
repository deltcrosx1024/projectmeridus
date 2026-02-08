import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Discord Bot Interaction Handler
 * POST /api/webhooks/services/discord
 *
 * Handles Discord bot interactions (slash commands, buttons, etc.)
 * Configure in Discord Developer Portal → Applications → Interactions Endpoint URL
 * URL: https://yourdomain.com/api/webhooks/services/discord
 * Public Key: Set DISCORD_PUBLIC_KEY in env
 */
export async function POST(request: Request) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }

  // Verify Discord signature
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('[Discord] DISCORD_PUBLIC_KEY not set');
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const isValid = verifyDiscordSignature(signature, timestamp, body, publicKey);
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const interaction = JSON.parse(body);

    // Respond to PING
    if (interaction.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    // Handle APPLICATION_COMMAND (slash commands)
    if (interaction.type === 2) {
      const commandName = interaction.data.name;
      console.log(`[Discord] Slash command: ${commandName}`);

      // Example: /ping command
      if (commandName === 'ping') {
        return respondToInteraction({
          content: '🏓 Pong!',
        });
      }

      // Example: /repo command with options
      if (commandName === 'repo') {
        const owner = interaction.data.options?.[0]?.value;
        const repo = interaction.data.options?.[1]?.value;

        if (!owner || !repo) {
          return respondToInteraction({
            content: '❌ Please provide owner and repo name',
          });
        }

        return respondToInteraction({
          content: `📦 Repository: **${owner}/${repo}**\nhttps://github.com/${owner}/${repo}`,
        });
      }

      // Default response
      return respondToInteraction({
        content: `❌ Unknown command: ${commandName}`,
      });
    }

    // Handle MESSAGE_COMPONENT (buttons, select menus)
    if (interaction.type === 3) {
      const customId = interaction.data.custom_id;
      console.log(`[Discord] Component interaction: ${customId}`);

      return respondToInteraction({
        content: `✅ You clicked: ${customId}`,
      });
    }

    return NextResponse.json({ error: 'Unhandled interaction type' }, { status: 400 });
  } catch (err: any) {
    console.error('[Discord Interaction Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Verify Discord interaction signature

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
    
    // Use Node.js crypto.verify with raw Ed25519 key
    const isValid = crypto.verify(
      'ed25519',
      message,
      keyBytes,
      sigBytes
    );
    return isValid;
  } catch (err) {
    console.error('[Discord Signature Verification Error]', err);
    return false;
  }
}

// Helper to respond to Discord interaction

function respondToInteraction(data: {
  content?: string;
  embeds?: any[];
  ephemeral?: boolean;
}) {
  return NextResponse.json({
    type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
    data: {
      content: data.content,
      embeds: data.embeds,
      flags: data.ephemeral ? 64 : 0, // Ephemeral = only visible to user
    },
  });
}
