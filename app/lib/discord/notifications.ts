// lib/discord/notifications.ts
// Send GitHub webhook notifications to subscribed Discord channels

import { getRepoSubscriptions } from '../subscriptions';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

interface DiscordMessage {
  content: string;
  embeds?: any[];
}

/**
 * Send a GitHub notification to all subscribed channels for a repository
 */
export async function sendGitHubNotification(
  message: string,
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

  try {
    // Get all subscriptions for this repository
    const subscriptions = await getRepoSubscriptions(repoFullName);

    if (subscriptions.length === 0) {
      console.log(`[Discord Notifications] No subscriptions for ${repoFullName}`);
      return;
    }

    console.log(`[Discord Notifications] Sending to ${subscriptions.length} channel(s) for ${repoFullName}`);

    // Send to each subscribed channel
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await sendToChannel(sub.channelId, { content: message });
        console.log(`[Discord Notifications] Sent to channel ${sub.channelId}`);
      } catch (err) {
        console.error(`[Discord Notifications] Failed to send to channel ${sub.channelId}:`, err);
      }
    });

    await Promise.all(sendPromises);
  } catch (err) {
    console.error('[Discord Notifications] Error:', err);
  }
}

/**
 * Send a message to a Discord channel
 */
async function sendToChannel(channelId: string, message: DiscordMessage): Promise<void> {
  const url = `https://discord.com/api/v10/channels/${channelId}/messages`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(`Discord API error: ${response.status} - ${error.message || JSON.stringify(error)}`);
  }
}

/**
 * Send a test notification to a channel
 */
export async function sendTestNotification(channelId: string): Promise<boolean> {
  try {
    await sendToChannel(channelId, {
      content: '🧪 **Test Notification**\nThis is a test from Meridus Bot!',
    });
    return true;
  } catch (err) {
    console.error('[Discord Notifications] Test failed:', err);
    return false;
  }
}
