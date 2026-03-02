// lib/discord/notifications.ts
// Send GitHub webhook notifications to subscribed Discord channels with rich embeds

import { getRepoSubscriptions } from '../subscriptions';
import {
  buildPushEmbed,
  buildPullRequestEmbed,
  buildIssueEmbed,
  buildReleaseEmbed,
  buildIssueCommentEmbed,
  DiscordMessage,
} from './embedBuilder';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

// Track last send time per channel for rate limiting
const lastSendTime: Map<string, number> = new Map();
const RATE_LIMIT_DELAY = 1000; // 1 second between messages to same channel

/**
 * Send a GitHub notification to all subscribed channels for a repository
 */
export async function sendGitHubNotification(
  event: string,
  payload: any,
  repoFullName: string
): Promise<void> {
  if (!DISCORD_BOT_TOKEN) {
    console.error('[Discord Notifications] DISCORD_BOT_TOKEN not set');
    return;
  }

  if (!repoFullName) {
    console.error('[Discord Notifications] No repository specified');
    return;
  }

  // Build the appropriate embed based on event type
  let message: DiscordMessage;
  switch (event) {
    case 'push':
      message = buildPushEmbed(payload);
      break;
    case 'pull_request':
      message = buildPullRequestEmbed(payload);
      break;
    case 'issues':
      message = buildIssueEmbed(payload);
      break;
    case 'issue_comment':
      message = buildIssueCommentEmbed(payload);
      break;
    case 'release':
      message = buildReleaseEmbed(payload);
      break;
    default:
      console.log(`[Discord Notifications] Unhandled event type: ${event}`);
      return;
  }

  try {
    // Get all subscriptions for this repository
    const subscriptions = await getRepoSubscriptions(repoFullName);

    if (subscriptions.length === 0) {
      console.log(`[Discord Notifications] No subscriptions for ${repoFullName}`);
      return;
    }

    console.log(`[Discord Notifications] Sending ${event} notification to ${subscriptions.length} channel(s) for ${repoFullName}`);

    // Send sequentially with delay to avoid rate limits
    for (const sub of subscriptions) {
      try {
        // Check rate limit for this channel
        const lastSend = lastSendTime.get(sub.channelId) || 0;
        const timeSinceLastSend = Date.now() - lastSend;

        if (timeSinceLastSend < RATE_LIMIT_DELAY) {
          const waitTime = RATE_LIMIT_DELAY - timeSinceLastSend;
          console.log(`[Discord Notifications] Rate limiting: waiting ${waitTime}ms for channel ${sub.channelId}`);
          await sleep(waitTime);
        }

        await sendToChannel(sub.channelId, message);
        lastSendTime.set(sub.channelId, Date.now());
        console.log(`[Discord Notifications] Sent to channel ${sub.channelId}`);
      } catch (err) {
        console.error(`[Discord Notifications] Failed to send to channel ${sub.channelId}:`, err);
      }
    }
  } catch (err) {
    console.error('[Discord Notifications] Error:', err);
  }
}

/**
 * Send a message to a Discord channel with retry logic
 */
async function sendToChannel(channelId: string, message: DiscordMessage, retries = 3): Promise<void> {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      return; // Success
    }

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000;

      console.log(`[Discord Notifications] Rate limited, waiting ${delayMs}ms before retry ${attempt}/${retries}`);

      if (attempt < retries) {
        await sleep(delayMs);
        continue; // Retry
      }
    }

    // Other error
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Discord API error: ${response.status} - ${error.message || JSON.stringify(error)}`);
  }

  throw new Error(`Failed to send after ${retries} retries`);
}

/**
 * Sleep/delay helper
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Send a test notification to a channel
 */
export async function sendTestNotification(channelId: string): Promise<boolean> {
  try {
    const { EmbedColors } = await import('@/app/types/discord');
    await sendToChannel(channelId, {
      content: '',
      embeds: [{
        title: '🧪 Test Notification',
        description: 'This is a test from Meridus Bot!',
        color: EmbedColors.PRIMARY,
        timestamp: new Date().toISOString(),
      }],
    });
    return true;
  } catch (err) {
    console.error('[Discord Notifications] Test failed:', err);
    return false;
  }
}
