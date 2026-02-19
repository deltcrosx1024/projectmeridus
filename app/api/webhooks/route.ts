import { NextResponse } from 'next/server';

/**
 * Universal Webhook Forwarder
 * POST /api/webhooks?service=discord
 * 
 * Forwards messages to external services (Discord, Slack, etc.)
 * Uses the service parameter to determine where to send
 * 
 * Query params:
 * - service: The target service (discord, slack, etc.)
 * - channel: Optional channel ID for Discord (uses default if not provided)
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const service = url.searchParams.get('service');
  const body = await request.json();

  if (!service) {
    return NextResponse.json({ error: 'Missing service parameter' }, { status: 400 });
  }

  try {
    switch (service) {
      case 'discord':
        return await sendToDiscord(request, body);
      case 'slack':
        return await sendToSlack(request, body);
      default:
        return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
    }
  } catch (err: any) {
    console.error(`[Webhook] Error forwarding to ${service}:`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Send message to Discord using Bot API
async function sendToDiscord(request: Request, body: any) {
  const discordBotToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!discordBotToken) {
    return NextResponse.json({ error: 'Discord bot not configured' }, { status: 500 });
  }

  // Get channel ID from query param, body, or use dynamically determined channel
  const url = new URL(request.url);
  const channelId = url.searchParams.get('channel') || body.channel_id;

  // If no channel provided, try to get from GitHub repo configuration
  if (!channelId) {
    const repoFullName = body.repository?.full_name || body.repo;
    if (repoFullName) {
      const configuredChannel = await getChannelForRepo(repoFullName);
      if (configuredChannel) {
        // Send to configured channel
        return sendToDiscordChannel(discordBotToken, configuredChannel, body);
      }
    }
    // Fall back to first available channel in the bot's guilds
    const fallbackChannel = await getFirstAvailableChannel(discordBotToken);
    if (fallbackChannel) {
      return sendToDiscordChannel(discordBotToken, fallbackChannel, body);
    }
    return NextResponse.json({ error: 'No channel configured. Use /config command in Discord.' }, { status: 400 });
  }

  return sendToDiscordChannel(discordBotToken, channelId, body);
}

// Send message to a specific Discord channel
async function sendToDiscordChannel(botToken: string, channelId: string, body: any) {
  // Build Discord embed from the message body
  const payload: any = {
    content: body.content || '',
  };

  // If there's an embed, add it
  if (body.embeds && body.embeds.length > 0) {
    payload.embeds = body.embeds;
  } else if (body.embed) {
    payload.embeds = [body.embed];
  } else if (body.repository || body.repo) {
    // Create embed from GitHub event data
    payload.embeds = [createGitHubEmbed(body)];
  }

  // Send message to Discord channel
  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Discord API Error]', error);
    return NextResponse.json({ error: `Discord API error: ${response.status}` }, { status: response.status });
  }

  const result = await response.json();
  return NextResponse.json({ success: true, message_id: result.id, service: 'discord', channel: channelId });
}

// Create a rich embed from GitHub event data
function createGitHubEmbed(body: any): any {
  const colors: { [key: string]: number } = {
    push: 0x00ff00,      // Green
    pull_request: 0x0099ff, // Blue
    issues: 0xff9900,    // Orange
    release: 0x9900ff,   // Purple
    star: 0xffd700,      // Gold
    fork: 0x00ffff,      // Cyan
  };

  const eventType = body.event || body.action || 'push';
  const color = colors[eventType] || 0x7289da;

  const embed: any = {
    color,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'GitHub Webhook',
    },
  };

  if (body.repository) {
    embed.title = body.repository.full_name || body.repository.name;
    embed.url = body.repository.html_url;
  }

  if (body.pusher) {
    embed.description = `Pushed by **${body.pusher.name}**`;
  }

  if (body.commits) {
    embed.fields = [
      { name: 'Commits', value: `${body.commits.length} commit(s)`, inline: true },
      { name: 'Branch', value: body.ref?.split('/').pop() || 'main', inline: true },
    ];
  }

  if (body.pull_request) {
    embed.fields = [
      { name: 'Action', value: body.action, inline: true },
      { name: 'Author', value: body.pull_request.user?.login || 'unknown', inline: true },
      { name: 'URL', value: body.pull_request.html_url, inline: false },
    ];
  }

  if (body.issue) {
    embed.fields = [
      { name: 'Issue', value: `#${body.issue.number}: ${body.issue.title}`, inline: false },
      { name: 'Author', value: body.issue.user?.login || 'unknown', inline: true },
      { name: 'State', value: body.issue.state, inline: true },
    ];
  }

  return embed;
}

// Get channel for a specific repo from configuration
async function getChannelForRepo(repoFullName: string): Promise<string | null> {
  // Try to get from environment variable pattern: DISCORD_CHANNEL_{owner}_{repo}
  const envKey = `DISCORD_CHANNEL_${repoFullName.replace('/', '_').toUpperCase()}`;
  const channelId = process.env[envKey];
  if (channelId) return channelId;
  
  return null;
}

// Get first available channel from bot's servers
async function getFirstAvailableChannel(botToken: string): Promise<string | null> {
  try {
    // Get the bot's current guilds
    const guildsRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { 'Authorization': `Bot ${botToken}` }
    });
    
    if (!guildsRes.ok) return null;
    const guilds = await guildsRes.json();
    
    if (!guilds.length) return null;
    
    // Get channels for the first guild
    const firstGuildId = guilds[0].id;
    const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${firstGuildId}/channels`, {
      headers: { 'Authorization': `Bot ${botToken}` }
    });
    
    if (!channelsRes.ok) return null;
    const channels = await channelsRes.json();
    
    // Find first text channel
    const textChannel = channels.find((c: any) => c.type === 0);
    return textChannel?.id || null;
  } catch (err) {
    console.error('[Get Channel Error]', err);
    return null;
  }
}

// Send message to Slack
async function sendToSlack(request: Request, body: any) {
  const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!slackWebhookUrl) {
    return NextResponse.json({ error: 'Slack not configured' }, { status: 500 });
  }

  const payload = {
    text: body.content || body.text || '',
    blocks: body.blocks,
    channel: body.channel,
  };

  const response = await fetch(slackWebhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Slack API Error]', error);
    return NextResponse.json({ error: `Slack API error: ${response.status}` }, { status: response.status });
  }

  return NextResponse.json({ success: true, service: 'slack' });
}