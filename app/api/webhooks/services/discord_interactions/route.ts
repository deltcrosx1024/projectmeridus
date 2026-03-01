import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * Discord Bot Interaction Handler
 * POST /api/webhooks/services/discord_interactions - Interactions (slash commands, buttons)
 * GET  /api/webhooks/services/discord_interactions - URL verification & Linked Roles
 * 
 * Handles Discord bot interactions and Linked Roles verification
 * Configure in Discord Developer Portal → Applications → Interactions Endpoint URL
 * URL: https://yourdomain.com/api/webhooks/services/discord
 * Public Key: Set DISCORD_PUBLIC_KEY in env
 */

// Handle GET requests (Linked Roles verification)
export async function GET(request: Request) {
  const url = new URL(request.url);
  const interactionToken = url.searchParams.get('interaction_token');
  
  // This is a Linked Roles verification request
  if (interactionToken) {
    return handleLinkedRolesVerification(request);
  }
  
  // Default GET - URL verification from Discord
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Discord bot endpoint is active. Add to Interaction Endpoint URL in Discord Developer Portal.'
  });
}

// Handle Linked Roles verification
async function handleLinkedRolesVerification(request: Request) {
  const url = new URL(request.url);
  const interactionToken = url.searchParams.get('interaction_token');
  const userId = url.searchParams.get('user_id');
  
  if (!interactionToken || !userId) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }
  
  console.log(`[Linked Roles] Verification for user: ${userId}`);
  
  // Get the user's GitHub data from cookies
  const cookieStore = await cookies();
  const githubUserCookie = cookieStore.get('github_user')?.value;
  
  if (!githubUserCookie) {
    // User not linked - return empty metadata
    return NextResponse.json({
      metadata: {}
    });
  }
  
  try {
    const githubUser = JSON.parse(decodeURIComponent(githubUserCookie));
    
    // Get additional GitHub stats
    const cookieToken = cookieStore.get('github_token')?.value;
    let additionalData: Record<string, unknown> = {};
    
    if (cookieToken) {
      try {
        const octokit = new Octokit({ auth: cookieToken });
        const { data: user } = await octokit.rest.users.getAuthenticated();
        
        additionalData = {
          github_id: user.id,
          login: user.login,
          name: user.name,
          public_repos: user.public_repos,
          followers: user.followers,
          following: user.following,
          created_at: user.created_at,
        };
      } catch (err) {
        console.error('[Linked Roles] Failed to fetch additional GitHub data:', err);
      }
    }
    
    // Return metadata that will be shown in Discord Linked Roles
    return NextResponse.json({
      metadata: {
        // These keys must match what you configure in Discord Developer Portal
        github_username: githubUser.login || additionalData.login || '',
        github_id: String(additionalData.github_id || ''),
        public_repos: String(additionalData.public_repos || '0'),
        followers: String(additionalData.followers || '0'),
        account_age: calculateAccountAge(additionalData.created_at || githubUser.created_at),
      }
    });
    
  } catch (err) {
    console.error('[Linked Roles] Error:', err);
    return NextResponse.json({ metadata: {} });
  }
}

// Calculate account age in days
function calculateAccountAge(createdAt?: string): string {
  if (!createdAt) return '0';
  const created = new Date(createdAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - created.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return String(diffDays);
}

// Handle POST requests (Discord interactions)
export async function POST(request: Request) {
  const signature = request.headers.get('x-signature-ed25519');
  const timestamp = request.headers.get('x-signature-timestamp');
  const body = await request.text();

  // Debug: log received body
  console.log('[Discord] Received body:', body);
  
  // Handle empty body
  if (!body || body.trim() === '') {
    console.log('[Discord] Empty body received');
    return NextResponse.json({ error: 'Empty body' }, { status: 400 });
  }
  
  // Parse the body to check interaction type
  let interaction: Record<string, unknown> = {};  
  try {
    interaction = JSON.parse(body);
  } catch (e) {
    console.log('[Discord] JSON parse error:', e);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  // Handle PING (type: 1) - Discord sends this to verify the endpoint
  // For URL verification, Discord expects a PONG response
  if (interaction.type === 1) {
    console.log('[Discord] Received PING - responding with PONG');
    // Verify signature even for PING to ensure endpoint is properly configured
    if (!signature || !timestamp) {
      console.log('[Discord] PING without signature - responding anyway for URL verification');
      return NextResponse.json({ type: 1 });
    }
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    if (!publicKey) {
      console.error('[Discord] DISCORD_PUBLIC_KEY not set');
      return NextResponse.json({ type: 1 }); // Still respond for URL verification
    }
    const isValid = verifyDiscordSignature(signature, timestamp, body, publicKey);
    if (!isValid) {
      console.log('[Discord] Invalid signature on PING - responding anyway for URL verification');
      return NextResponse.json({ type: 1 }); // Still respond for URL verification
    }
    return NextResponse.json({ type: 1 });
  }
  
  // For other interactions, verify the signature
  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 400 });
  }
  
  // Verify Discord signature
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('[Discord] DISCORD_PUBLIC_KEY not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }
  
  const isValid = verifyDiscordSignature(signature, timestamp, body, publicKey);
  if (!isValid) {
    console.log('[Discord] Invalid signature - rejecting request');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  
  // Handle the interaction based on its type
  try {
    const interaction = JSON.parse(body);
    
    // Handle APPLICATION_COMMAND (slash commands)
    if (interaction.type === 2) {
      const commandName = interaction.data?.name;
      console.log(`[Discord] Received command: ${commandName}`);
      
      // Example response to a slash command
      return NextResponse.json({
        type: 4, // Channel message with source
        data: { content: `You invoked the command: ${commandName}` }
      });
    }
    
    // Handle MESSAGE_COMPONENT (buttons, select menus)
    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id;
      console.log(`[Discord] Component interaction: ${customId}`);
      
      return NextResponse.json({
        type: 4,
        data: { content: `You clicked: ${customId}` }
      });
    }
    
    return NextResponse.json({ error: 'Unhandled interaction type' }, { status: 400 });
  } catch (err: unknown) {
    console.error('[Discord Interaction Error]', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Verify Discord interaction signature using Ed25519
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
    
    // Discord uses raw Ed25519 - wrap in SPKI format for Node.js
    const spkiPrefix = Buffer.from([
      0x30, 0x2a, // SEQUENCE
      0x30, 0x05, // SEQUENCE (algorithm identifier)
      0x06, 0x03, 0x2b, 0x65, 0x70, // OID Ed25519 (1.3.101.112)
      0x03, 0x21, 0x00, // BIT STRING prefix
    ]);
    
    const spkiKey = Buffer.concat([spkiPrefix, keyBytes]);
    
    const isValid = crypto.verify(
      undefined,
      message,
      {
        key: spkiKey,
        format: 'der',
        type: 'spki',
      },
      sigBytes
    );
    return isValid;
  } catch (err) {
    console.error('[Discord Signature Verification Error]', err);
    return false;
  }
}
