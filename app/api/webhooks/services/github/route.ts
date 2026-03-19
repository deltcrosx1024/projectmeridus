import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { redis } from '@/app/lib/redis';
import { getUserSettings } from '@/app/lib/settings';

const NOTIFICATIONS_PREFIX = 'meridus:notifications:';
const SETTINGS_PREFIX = 'settings:';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

async function getLinkedUsersForRepo(repoFullName: string): Promise<string[]> {
  const users: string[] = [];
  let cursor = '0';
  
  do {
    const result = await redis.scan(cursor, { match: 'meridus:link:*', count: 100 });
    cursor = result[0];
    const keys = result[1];
    
    for (const key of keys) {
      try {
        const data = await redis.get<string>(key);
        if (data) {
          const parsed = JSON.parse(data);
          users.push(parsed.discordUserId);
        }
      } catch (err) {
        console.error('[GitHub Webhook] Error getting linked user:', err);
      }
    }
  } while (cursor !== '0');
  
  return users;
}

async function shouldSendNotification(userId: string, eventType: string): Promise<boolean> {
  try {
    const settings = await getUserSettings(`discord:${userId}`);
    
    switch (eventType) {
      case 'push':
        return settings.commitNotifications === true;
      case 'pull_request':
        return settings.prAlerts === true;
      case 'issues':
        return settings.issueAlerts === true;
      case 'release':
        return settings.releaseAlerts === true;
      default:
        return true;
    }
  } catch (err) {
    console.error('[GitHub Webhook] Error checking user settings:', err);
    return true;
  }
}

async function saveNotification(userId: string, notification: {
  type: 'webhook' | 'issue' | 'commit' | 'pr' | 'release';
  title: string;
  message: string;
  data?: { repo?: string; url?: string };
}) {
  try {
    const key = `${NOTIFICATIONS_PREFIX}${userId}`;
    const notif = {
      id: generateId(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    await redis.lpush(key, JSON.stringify(notif));
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, 60 * 60 * 24 * 7);
  } catch (err) {
    console.error('[GitHub Webhook] Failed to save notification:', err);
  }
}

/**
 * GitHub Webhook Handler
 * POST /api/webhooks/services/github
 * GET /api/webhooks/services/github (for webhook verification)
 *
 * Receives GitHub repository events and forwards them to:
 * 1. The Discord bot (meridusbot) for notifications
 * 2. Internal webhook services for processing
 * 
 * Configure in GitHub → Settings → Webhooks
 * - Payload URL: https://yourdomain.com/api/webhooks/services/github
 * - Content type: application/json
 * - Secret: Set GITHUB_WEBHOOK_SECRET env var
 */

// Bot URL for forwarding events to meridusbot
const getMeridusBotUrl = (): string | undefined => {
  return process.env.MERIDUS_BOT_URL || process.env.NEXT_PUBLIC_MERIDUS_BOT_URL;
};

export async function GET() {
  // GitHub sends a GET request to verify the webhook endpoint
  return NextResponse.json({ status: 'ok', message: 'GitHub webhook endpoint is active' });
}

export async function POST(request: Request) {
  const signature = request.headers.get('x-hub-signature-256');
  const body = await request.text();
  const event = request.headers.get('x-github-event');
  const deliveryId = request.headers.get('x-github-delivery');

  // Verify GitHub signature (required for security)
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[GitHub Webhook] GITHUB_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature header' }, { status: 401 });
  }

  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex');
  const expected = `sha256=${hash}`;

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(body);
    const repoFullName = payload.repository?.full_name;
    console.log(`[GitHub Webhook] Event: ${event}, Repo: ${repoFullName}`);

    // Only process supported events
    const supportedEvents = ['push', 'pull_request', 'issues', 'issue_comment', 'release'];
    if (!supportedEvents.includes(event || '')) {
      console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
      return NextResponse.json({ received: true, event, deliveryId, ignored: true }, { status: 200 });
    }

    // Get linked users for this repository
    const linkedUsers = await getLinkedUsersForRepo(repoFullName);
    console.log(`[GitHub Webhook] Found ${linkedUsers.length} linked users`);

    // Send to subscribed Discord channels with rich embeds
    const { sendGitHubNotification } = await import('@/app/lib/discord/notifications');
    await sendGitHubNotification(event!, payload, repoFullName);

    // Save notifications for linked users based on their preferences
    for (const userId of linkedUsers) {
      const shouldSend = await shouldSendNotification(userId, event!);
      if (shouldSend) {
        let title = '';
        let message = '';
        
        switch (event) {
          case 'push':
            title = 'New Commits Pushed';
            message = `${payload.commits?.length || 0} commit(s) pushed to ${repoFullName}`;
            break;
          case 'pull_request':
            title = `Pull Request ${payload.action}`;
            message = `${payload.pull_request?.title} in ${repoFullName}`;
            break;
          case 'issues':
            title = `Issue ${payload.action}`;
            message = `${payload.issue?.title} in ${repoFullName}`;
            break;
          case 'release':
            title = `New Release: ${payload.release?.tag_name}`;
            message = `${repoFullName}`;
            break;
          default:
            title = `GitHub: ${event}`;
            message = repoFullName;
        }
        
        await saveNotification(userId, {
          type: event === 'pull_request' ? 'pr' : event === 'issues' ? 'issue' : event === 'release' ? 'release' : 'commit',
          title,
          message,
          data: { 
            repo: repoFullName, 
            url: payload.pull_request?.html_url || payload.issue?.html_url || payload.release?.html_url || payload.repository?.html_url 
          },
        });
      }
    }

    return NextResponse.json({ received: true, event, deliveryId }, { status: 200 });
  } catch (err: any) {
    console.error('[GitHub Webhook Error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Event formatters

function formatPushEvent(payload: any): string {
  const repo = payload.repository.full_name;
  const branch = payload.ref.split('/').pop();
  const commits = payload.commits.length;
  const author = payload.pusher.name;

  return (
    `📤 **Push to ${repo}**\n` +
    `Branch: \`${branch}\` | Commits: ${commits}\n` +
    `Author: ${author}\n` +
    `${payload.compare}`
  );
}

function formatPullRequestEvent(payload: any): string {
  const action = payload.action;
  const repo = payload.repository.full_name;
  const pr = payload.pull_request;

  const emoji: { [key: string]: string } = {
    opened: '🔀',
    closed: '✅',
    reopened: '🔄',
    synchronize: '🔄',
  };

  return (
    `${emoji[action] || '📝'} **PR ${action}: ${pr.title}**\n` +
    `Repo: ${repo}\n` +
    `Author: ${pr.user.login}\n` +
    `${pr.html_url}`
  );
}

function formatIssuesEvent(payload: any): string {
  const action = payload.action;
  const repo = payload.repository.full_name;
  const issue = payload.issue;

  const emoji: { [key: string]: string } = {
    opened: '📋',
    closed: '✔️',
    reopened: '🔄',
  };

  return (
    `${emoji[action] || '📝'} **Issue ${action}: ${issue.title}**\n` +
    `Repo: ${repo} (#${issue.number})\n` +
    `Author: ${issue.user.login}\n` +
    `${issue.html_url}`
  );
}

function formatIssueCommentEvent(payload: any): string {
  const action = payload.action;
  const repo = payload.repository.full_name;
  const issue = payload.issue;
  const comment = payload.comment;

  return (
    `💬 **Comment ${action} on #${issue.number}**\n` +
    `Repo: ${repo}\n` +
    `${issue.title}\n` +
    `By: ${comment.user.login}\n` +
    `${comment.html_url}`
  );
}

function formatReleaseEvent(payload: any): string {
  const release = payload.release;
  const repo = payload.repository.full_name;

  return (
    `🚀 **Release ${payload.action}: ${release.tag_name}**\n` +
    `Repo: ${repo}\n` +
    `${release.name || release.tag_name}\n` +
    `${release.html_url}`
  );
}
