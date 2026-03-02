// lib/discord/embedBuilder.ts
// Build rich Discord embeds with action buttons for GitHub events

import { EmbedColors } from '@/app/types/discord';

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  thumbnail?: { url: string };
  image?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
}

export interface DiscordButton {
  type: 2;
  style: 1 | 2 | 3 | 4 | 5; // Primary, Secondary, Success, Danger, Link
  label: string;
  emoji?: { name: string; id?: string };
  custom_id?: string;
  url?: string;
  disabled?: boolean;
}

export interface DiscordActionRow {
  type: 1;
  components: DiscordButton[];
}

export interface DiscordMessage {
  content?: string;
  embeds: DiscordEmbed[];
  components?: DiscordActionRow[];
}

// GitHub avatar URLs
const GITHUB_ICON = 'https://github.com/fluidicon.png';

/**
 * Build push event embed
 */
export function buildPushEmbed(payload: any): DiscordMessage {
  const repo = payload.repository;
  const branch = payload.ref?.replace('refs/heads/', '');
  const commits = payload.commits || [];
  const sender = payload.sender;

  const embed: DiscordEmbed = {
    author: {
      name: sender?.login || 'Unknown',
      url: sender?.html_url,
      icon_url: sender?.avatar_url,
    },
    title: `📤 Push to ${repo.full_name}`,
    description: `**${commits.length}** commit(s) pushed to \`${branch}\``,
    url: payload.compare,
    color: EmbedColors.GITHUB,
    timestamp: new Date().toISOString(),
    footer: {
      text: repo.full_name,
      icon_url: GITHUB_ICON,
    },
  };

  // Add commit details (max 3)
  if (commits.length > 0) {
    embed.fields = commits.slice(0, 3).map((commit: any) => ({
      name: `\`${commit.id.substring(0, 7)}\` ${commit.message.split('\n')[0].substring(0, 50)}`,
      value: `By: ${commit.author?.name || 'Unknown'}`,
      inline: false,
    }));

    if (commits.length > 3) {
      embed.fields = embed.fields || [];
      embed.fields.push({
        name: `...and ${commits.length - 3} more commits`,
        value: `[View all commits](${payload.compare})`,
        inline: false,
      });
    }
  }

  // Action buttons
  const components: DiscordActionRow[] = [{
    type: 1,
    components: [
      {
        type: 2,
        style: 5, // Link
        label: 'View Changes',
        url: payload.compare,
      },
      {
        type: 2,
        style: 2, // Secondary
        label: 'Create Issue',
        emoji: { name: '📋' },
        custom_id: `gh:create_issue:${repo.full_name}`,
      },
      {
        type: 2,
        style: 2, // Secondary
        label: 'Create PR',
        emoji: { name: '🔀' },
        custom_id: `gh:create_pr:${repo.full_name}:${branch}`,
      },
      {
        type: 2,
        style: 2, // Secondary
        label: 'Code Review',
        emoji: { name: '👀' },
        custom_id: `gh:review:${repo.full_name}:${branch}`,
      },
    ],
  }];

  return { embeds: [embed], components };
}

/**
 * Build PR event embed
 */
export function buildPullRequestEmbed(payload: any): DiscordMessage {
  const repo = payload.repository;
  const pr = payload.pull_request;
  const action = payload.action;
  const sender = payload.sender;

  const actionEmojis: Record<string, string> = {
    opened: '🔀',
    closed: pr.merged ? '✅' : '🚫',
    reopened: '🔄',
    synchronize: '🔄',
    ready_for_review: '👀',
  };

  const actionColors: Record<string, number> = {
    opened: EmbedColors.PRIMARY,
    closed: pr?.merged ? EmbedColors.SUCCESS : EmbedColors.ERROR,
    reopened: EmbedColors.WARNING,
    synchronize: EmbedColors.INFO,
    ready_for_review: EmbedColors.INFO,
  };

  const embed: DiscordEmbed = {
    author: {
      name: sender?.login || 'Unknown',
      url: sender?.html_url,
      icon_url: sender?.avatar_url,
    },
    title: `${actionEmojis[action] || '📝'} PR ${action}: ${pr.title}`,
    description: pr.body?.substring(0, 200) + (pr.body?.length > 200 ? '...' : '') || 'No description',
    url: pr.html_url,
    color: actionColors[action] || EmbedColors.INFO,
    timestamp: new Date().toISOString(),
    footer: {
      text: `${repo.full_name} #${pr.number}`,
      icon_url: GITHUB_ICON,
    },
    fields: [
      {
        name: 'Branch',
        value: `\`${pr.head.ref}\` → \`${pr.base.ref}\``,
        inline: true,
      },
      {
        name: 'Status',
        value: pr.draft ? '📝 Draft' : pr.merged ? '✅ Merged' : pr.state === 'closed' ? '🚫 Closed' : '🟢 Open',
        inline: true,
      },
    ],
  };

  if (pr.additions !== undefined && pr.deletions !== undefined) {
    embed.fields?.push({
      name: 'Changes',
      value: `+${pr.additions} / -${pr.deletions}`,
      inline: true,
    });
  }

  // Action buttons based on PR state
  const components: DiscordActionRow[] = [];

  if (action === 'opened' || action === 'ready_for_review' || action === 'synchronize') {
    components.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 5, // Link
          label: 'View PR',
          url: pr.html_url,
        },
        {
          type: 2,
          style: 3, // Success
          label: 'Merge',
          emoji: { name: '✅' },
          custom_id: `gh:merge:${repo.full_name}:${pr.number}`,
        },
        {
          type: 2,
          style: 1, // Primary
          label: 'Review',
          emoji: { name: '👀' },
          custom_id: `gh:review_pr:${repo.full_name}:${pr.number}`,
        },
        {
          type: 2,
          style: 2, // Secondary
          label: 'Comment',
          emoji: { name: '💬' },
          custom_id: `gh:comment:${repo.full_name}:${pr.number}`,
        },
      ],
    });

    // Second row with more actions
    components.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 4, // Danger
          label: 'Close',
          emoji: { name: '🚫' },
          custom_id: `gh:close_pr:${repo.full_name}:${pr.number}`,
        },
        {
          type: 2,
          style: 2, // Secondary
          label: 'Rebase',
          emoji: { name: '🔄' },
          custom_id: `gh:rebase:${repo.full_name}:${pr.number}:confirm`,
        },
      ],
    });
  } else {
    // Closed/merged - just show link
    components.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 5, // Link
          label: 'View PR',
          url: pr.html_url,
        },
      ],
    });
  }

  return { embeds: [embed], components };
}

/**
 * Build issue event embed
 */
export function buildIssueEmbed(payload: any): DiscordMessage {
  const repo = payload.repository;
  const issue = payload.issue;
  const action = payload.action;
  const sender = payload.sender;

  const actionEmojis: Record<string, string> = {
    opened: '📋',
    closed: '✔️',
    reopened: '🔄',
    edited: '📝',
    labeled: '🏷️',
    assigned: '👤',
  };

  const actionColors: Record<string, number> = {
    opened: EmbedColors.PRIMARY,
    closed: EmbedColors.SUCCESS,
    reopened: EmbedColors.WARNING,
    edited: EmbedColors.INFO,
    labeled: EmbedColors.INFO,
    assigned: EmbedColors.INFO,
  };

  const embed: DiscordEmbed = {
    author: {
      name: sender?.login || 'Unknown',
      url: sender?.html_url,
      icon_url: sender?.avatar_url,
    },
    title: `${actionEmojis[action] || '📝'} Issue ${action}: ${issue.title}`,
    description: issue.body?.substring(0, 200) + (issue.body?.length > 200 ? '...' : '') || 'No description',
    url: issue.html_url,
    color: actionColors[action] || EmbedColors.INFO,
    timestamp: new Date().toISOString(),
    footer: {
      text: `${repo.full_name} #${issue.number}`,
      icon_url: GITHUB_ICON,
    },
  };

  if (issue.labels && issue.labels.length > 0) {
    embed.fields = [{
      name: 'Labels',
      value: issue.labels.map((l: any) => `\`${l.name}\``).join(', '),
      inline: true,
    }];
  }

  if (issue.assignees && issue.assignees.length > 0) {
    embed.fields?.push({
      name: 'Assignees',
      value: issue.assignees.map((a: any) => `@${a.login}`).join(', '),
      inline: true,
    });
  }

  // Action buttons for open issues
  const components: DiscordActionRow[] = [];

  if (issue.state === 'open') {
    components.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 5, // Link
          label: 'View Issue',
          url: issue.html_url,
        },
        {
          type: 2,
          style: 3, // Success
          label: 'Close',
          emoji: { name: '✔️' },
          custom_id: `gh:close_issue:${repo.full_name}:${issue.number}`,
        },
        {
          type: 2,
          style: 2, // Secondary
          label: 'Comment',
          emoji: { name: '💬' },
          custom_id: `gh:comment_issue:${repo.full_name}:${issue.number}`,
        },
      ],
    });
  } else {
    components.push({
      type: 1,
      components: [
        {
          type: 2,
          style: 5, // Link
          label: 'View Issue',
          url: issue.html_url,
        },
        {
          type: 2,
          style: 2, // Secondary
          label: 'Reopen',
          emoji: { name: '🔄' },
          custom_id: `gh:reopen_issue:${repo.full_name}:${issue.number}`,
        },
      ],
    });
  }

  return { embeds: [embed], components };
}

/**
 * Build release event embed
 */
export function buildReleaseEmbed(payload: any): DiscordMessage {
  const repo = payload.repository;
  const release = payload.release;
  const sender = payload.sender;

  const embed: DiscordEmbed = {
    author: {
      name: sender?.login || 'Unknown',
      url: sender?.html_url,
      icon_url: sender?.avatar_url,
    },
    title: `🚀 Release ${payload.action}: ${release.name || release.tag_name}`,
    description: release.body?.substring(0, 300) + (release.body?.length > 300 ? '...' : '') || 'No release notes',
    url: release.html_url,
    color: EmbedColors.SUCCESS,
    timestamp: new Date().toISOString(),
    footer: {
      text: repo.full_name,
      icon_url: GITHUB_ICON,
    },
  };

  if (release.prerelease) {
    embed.fields = [{
      name: '⚠️ Pre-release',
      value: 'This is a pre-release version',
      inline: false,
    }];
  }

  const components: DiscordActionRow[] = [{
    type: 1,
    components: [
      {
        type: 2,
        style: 5, // Link
        label: 'View Release',
        url: release.html_url,
      },
      {
        type: 2,
        style: 5, // Link
        label: 'Download',
        url: release.zipball_url,
      },
    ],
  }];

  return { embeds: [embed], components };
}

/**
 * Build issue comment event embed
 */
export function buildIssueCommentEmbed(payload: any): DiscordMessage {
  const repo = payload.repository;
  const issue = payload.issue;
  const comment = payload.comment;
  const sender = payload.sender;

  const isPR = issue.pull_request !== undefined;

  const embed: DiscordEmbed = {
    author: {
      name: sender?.login || 'Unknown',
      url: sender?.html_url,
      icon_url: sender?.avatar_url,
    },
    title: `💬 New comment on ${isPR ? 'PR' : 'Issue'} #${issue.number}`,
    description: comment.body?.substring(0, 300) + (comment.body?.length > 300 ? '...' : ''),
    url: comment.html_url,
    color: EmbedColors.INFO,
    timestamp: new Date().toISOString(),
    footer: {
      text: `${repo.full_name} - ${issue.title.substring(0, 50)}`,
      icon_url: GITHUB_ICON,
    },
  };

  const components: DiscordActionRow[] = [{
    type: 1,
    components: [
      {
        type: 2,
        style: 5, // Link
        label: 'View Comment',
        url: comment.html_url,
      },
      {
        type: 2,
        style: 2, // Secondary
        label: 'Reply',
        emoji: { name: '💬' },
        custom_id: `gh:reply:${repo.full_name}:${issue.number}`,
      },
    ],
  }];

  return { embeds: [embed], components };
}
