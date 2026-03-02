import { NextResponse } from 'next/server';
import crypto from 'crypto';

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
    console.log(`[GitHub Webhook] Event: ${event}, Repo: ${payload.repository?.full_name}`);

    // Only process supported events
    const supportedEvents = ['push', 'pull_request', 'issues', 'issue_comment', 'release'];
    if (!supportedEvents.includes(event || '')) {
      console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
      return NextResponse.json({ received: true, event, deliveryId, ignored: true }, { status: 200 });
    }

    // Send to subscribed Discord channels with rich embeds
    const { sendGitHubNotification } = await import('@/app/lib/discord/notifications');
    await sendGitHubNotification(event!, payload, payload.repository?.full_name);

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
