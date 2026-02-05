import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * GitHub Webhook Handler
 * POST /api/webhooks/github
 *
 * Receives GitHub repository events and optionally sends them to Discord
 * Configure in GitHub  Settings  Webhooks
 * - Payload URL: https://yourdomain.com/api/webhooks/github
 * - Content type: application/json
 * - Secret: Set and store in GITHUB_WEBHOOK_SECRET env var
 */
export async function POST(request: Request) {
  const signature = request.headers.get("x-hub-signature-256");
  const body = await request.text();

  // Verify GitHub signature
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[GitHub Webhook] GITHUB_WEBHOOK_SECRET not set - skipping verification");
  } else if (signature) {
    const hash = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const expected = `sha256=${hash}`;

    if (signature !== expected) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  const payload = JSON.parse(body);
  const event = request.headers.get("x-github-event");

  console.log(`[GitHub Webhook] Event: ${event}, Repo: ${payload.repository?.full_name}`);

  let discordMessage = "";

  // Handle different event types
  switch (event) {
    case "push":
      discordMessage = formatPushEvent(payload);
      break;

    case "pull_request":
      discordMessage = formatPullRequestEvent(payload);
      break;

    case "issues":
      discordMessage = formatIssuesEvent(payload);
      break;

    case "issue_comment":
      discordMessage = formatIssueCommentEvent(payload);
      break;

    case "release":
      discordMessage = formatReleaseEvent(payload);
      break;

    default:
      console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
  }

  // Send to Discord if message was generated
  if (discordMessage) {
    try {
      await sendDiscordNotification(discordMessage);
    } catch (err) {
      console.error("[Discord Notification Error]", err);
    }
  }

  return NextResponse.json({ received: true, event }, { status: 200 });
}

function formatPushEvent(payload: any): string {
  const repo = payload.repository.full_name;
  const branch = payload.ref.split("/").pop();
  const commits = payload.commits.length;
  const author = payload.pusher.name;

  return (
    ` **Push to ${repo}**\n` +
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
    opened: "",
    closed: "",
    reopened: "",
    synchronize: "",
  };

  return (
    `${emoji[action] || ""} **PR ${action}: ${pr.title}**\n` +
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
    opened: "",
    closed: "",
    reopened: "",
  };

  return (
    `${emoji[action] || ""} **Issue ${action}: ${issue.title}**\n` +
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
    ` **Comment ${action} on #${issue.number}**\n` +
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
    ` **Release ${payload.action}: ${release.tag_name}**\n` +
    `Repo: ${repo}\n` +
    `${release.name || release.tag_name}\n` +
    `${release.html_url}`
  );
}

async function sendDiscordNotification(message: string) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set - skipping notification");
    return;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: message,
      username: "GitHub Bot",
      avatar_url: "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord webhook failed: ${response.statusText}`);
  }
}
