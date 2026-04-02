// lib/discord/commands.ts
// Discord bot command handlers with QoL features

import { 
  DiscordCommand, 
  DiscordInteraction, 
  parseOptions, 
  getOptionValue,
  EmbedColors,
  DiscordEmbed
} from "@/app/types/discord";
import { 
  addSubscription, 
  removeSubscription, 
  getAllSubscriptions, 
  getSubscriptionCount,
  getRepoSubscriptions
} from "@/app/lib/subscriptions";
import { getUserLink, hasLinkedGitHub, unlinkUser, linkUser } from "@/app/lib/userLinks";
import { Octokit } from "octokit";
import { 
  checkCooldown, 
  setCooldown, 
  formatCooldownMessage 
} from "./cooldowns";
import { 
  checkPermission, 
  getPermissionErrorMessage,
  PermissionLevel
} from "./permissions";
import { formatErrorMessage, findSimilarRepos, isValidRepoFormat } from "./errorHandler";
import {
  getUserPreferences,
  toggleDMNotifications,
  setDMEventTypes,
  setDigestMode,
  setSilentMode,
  isInSilentMode,
  muteRepository,
  unmuteRepository,
  addNotificationFilter,
  removeNotificationFilter,
  setGitHubUsername
} from "./userPreferences";
import { 
  storePaginationState, 
  generatePaginationButtons,
  getPaginatedSlice,
  formatPaginationFooter
} from "./pagination";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || '';

// Get Octokit for a Discord user
async function getUserOctokit(interaction: DiscordInteraction): Promise<Octokit | null> {
  const discordUserId = interaction.member?.user?.id || interaction.user?.id;
  if (!discordUserId) return null;
  
  const userLink = await getUserLink(discordUserId);
  if (userLink) {
    return new Octokit({ auth: userLink.githubToken });
  }
  
  if (GITHUB_TOKEN) {
    return new Octokit({ auth: GITHUB_TOKEN });
  }
  
  return null;
}

// Check GitHub access with enhanced error messages
async function checkGitHubAccess(interaction: DiscordInteraction): Promise<{ ok: boolean; message?: string }> {
  const discordUserId = interaction.member?.user?.id || interaction.user?.id;
  
  if (!discordUserId) {
    return { ok: false, message: '❌ Could not identify Discord user.' };
  }
  
  const hasLink = await hasLinkedGitHub(discordUserId);
  if (!hasLink && !GITHUB_TOKEN) {
    return { 
      ok: false, 
      message: '🔒 **GitHub not linked.**\n\nPlease log in to the website with both GitHub and Discord:\n🔗 <https://www.meridusdev.in.th>' 
    };
  }
  
  return { ok: true };
}

// Get Discord user ID
function getUserId(interaction: DiscordInteraction): string | undefined {
  return interaction.member?.user?.id || interaction.user?.id;
}

// Command registry with QoL features
export const commands: Record<string, DiscordCommand> = {
  // 1. Ping - with cooldown check
  ping: {
    name: 'ping',
    description: 'Check if the bot is online and responsive',
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'ping');
        if (remaining > 0) {
          return { content: formatCooldownMessage(remaining), ephemeral: true };
        }
        await setCooldown(userId, 'ping');
      }
      
      const latency = Date.now();
      return {
        content: `🏓 Pong! Bot is online.\n⏱️ Latency: ${Date.now() - latency}ms`,
      };
    }
  },

  // 2. Status - enhanced with more stats
  status: {
    name: 'status',
    description: 'Show bot status, uptime, and system information',
    execute: async () => {
      const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : 0;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      
      const subscriptionCount = await getSubscriptionCount();
      
      const embed: DiscordEmbed = {
        title: '📊 Meridus Bot Status',
        description: 'Real-time system status and statistics',
        color: EmbedColors.SUCCESS,
        fields: [
          { name: '🔵 Status', value: 'Online ✅', inline: true },
          { name: '⏱️ Uptime', value: `${days}d ${hours}h ${minutes}m`, inline: true },
          { name: '📡 Subscriptions', value: subscriptionCount.toString(), inline: true },
          { name: '🤖 Bot Version', value: '2.0.0', inline: true },
          { name: '📅 Last Restart', value: new Date(Date.now() - uptimeSeconds * 1000).toLocaleDateString(), inline: true },
        ],
        footer: { text: 'DeltCroX DevHub' },
        timestamp: new Date().toISOString()
      };
      
      return { embeds: [embed] };
    }
  },

  // 3. Help - enhanced with command details
  help: {
    name: 'help',
    description: 'Show help information for commands',
    options: [
      {
        name: 'command',
        description: 'Get detailed help for a specific command',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'ping', value: 'ping' },
          { name: 'status', value: 'status' },
          { name: 'repos', value: 'repos' },
          { name: 'issues', value: 'issues' },
          { name: 'commits', value: 'commits' },
          { name: 'subscribe', value: 'subscribe' },
          { name: 'unsubscribe', value: 'unsubscribe' },
          { name: 'list', value: 'list' },
          { name: 'search', value: 'search' },
          { name: 'settings', value: 'settings' },
        ]
      }
    ],
    execute: async (interaction) => {
      const args = parseOptions(interaction);
      const cmd = args.command as string;
      
      if (cmd && commands[cmd]) {
        const command = commands[cmd];
        const embed: DiscordEmbed = {
          title: `📖 /${cmd} - Help`,
          description: command.description,
          color: EmbedColors.INFO,
          fields: []
        };
        
        if (command.options && command.options.length > 0) {
          embed.fields = command.options.map(opt => ({
            name: `${opt.name} ${opt.required ? '(required)' : '(optional)'}`,
            value: opt.description,
            inline: false
          }));
        }
        
        embed.fields?.push({
          name: '💡 Example',
          value: `\`/${cmd}${command.options?.filter(o => o.required).map(o => ` <${o.name}>`).join('') || ''}\``,
          inline: false
        });
        
        return { embeds: [embed] };
      }
      
      // General help
      const embed: DiscordEmbed = {
        title: '📚 Meridus Bot Commands',
        description: 'Here are all available commands:\n\nUse `/help command:<name>` for detailed info.',
        color: EmbedColors.PRIMARY,
        fields: [
          { name: 'ℹ️ General', value: '`/ping`, `/status`, `/help`', inline: false },
          { name: '📁 GitHub', value: '`/repos`, `/issues`, `/commits`, `/search`', inline: false },
          { name: '🔔 Subscriptions', value: '`/subscribe`, `/unsubscribe`, `/list`', inline: false },
          { name: '⚙️ Settings', value: '`/settings`, `/mystats`', inline: false },
        ],
        footer: { text: 'DeltCroX DevHub' }
      };
      
      return { embeds: [embed] };
    }
  },

  // 4. Subscribe - with bulk support and autocomplete
  subscribe: {
    name: 'subscribe',
    description: 'Subscribe channel(s) to GitHub repository events (Admin only)',
    options: [
      {
        name: 'channel',
        description: 'The channel to send notifications to',
        type: 7, // CHANNEL
        required: true
      },
      {
        name: 'repo',
        description: 'Repository(s) in format owner/repo (comma-separated for multiple)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'events',
        description: 'Events to subscribe to (default: push,issues,pr,release)',
        type: 3, // STRING
        required: false,
        autocomplete: true
      }
    ],
    execute: async (interaction) => {
      // Check permissions
      const permCheck = checkPermission(interaction, 'subscribe');
      if (!permCheck.allowed) {
        return { content: getPermissionErrorMessage('subscribe', permCheck.required, permCheck.level), ephemeral: true };
      }
      
      const args = parseOptions(interaction);
      const channelId = args.channel as string;
      const reposInput = args.repo as string;
      const eventsStr = (args.events as string) || 'push,issues,pull_request,release';
      const events = eventsStr.split(',').map(e => e.trim()).filter(e => e);
      
      // Support bulk subscribe with comma-separated repos
      const repos = reposInput.split(',').map(r => r.trim()).filter(r => r);
      const results: string[] = [];
      
      for (const repo of repos) {
        if (!isValidRepoFormat(repo)) {
          results.push(`❌ **${repo}**: Invalid format. Use: owner/repo`);
          continue;
        }
        
        try {
          await addSubscription(channelId, repo, events, interaction.guild_id);
          results.push(`✅ **${repo}**: Subscribed`);
        } catch (err: any) {
          results.push(`❌ **${repo}**: ${err.message}`);
        }
      }
      
      const embed: DiscordEmbed = {
        title: `📋 Subscription Results (${repos.length} repos)`,
        description: results.join('\n'),
        color: EmbedColors.SUCCESS,
        fields: [
          { name: '📺 Channel', value: `<#${channelId}>`, inline: true },
          { name: '🔔 Events', value: events.join(', '), inline: true }
        ]
      };
      
      return { embeds: [embed] };
    }
  },

  // 5. Unsubscribe - with confirmation modal support
  unsubscribe: {
    name: 'unsubscribe',
    description: 'Unsubscribe channel(s) from GitHub repository events (Admin only)',
    options: [
      {
        name: 'channel',
        description: 'The channel to unsubscribe',
        type: 7, // CHANNEL
        required: true
      },
      {
        name: 'repo',
        description: 'Repository to unsubscribe (leave empty for all)',
        type: 3, // STRING
        required: false,
        autocomplete: true
      },
      {
        name: 'confirm',
        description: 'Confirm unsubscribe all (type CONFIRM)',
        type: 3, // STRING
        required: false
      }
    ],
    execute: async (interaction) => {
      const permCheck = checkPermission(interaction, 'unsubscribe');
      if (!permCheck.allowed) {
        return { content: getPermissionErrorMessage('unsubscribe', permCheck.required, permCheck.level), ephemeral: true };
      }
      
      const args = parseOptions(interaction);
      const channelId = args.channel as string;
      const repo = (args.repo as string) || '';
      const confirm = (args.confirm as string) || '';
      
      // Check if unsubscribing all without confirmation
      if (!repo && confirm !== 'CONFIRM') {
        return {
          content: '⚠️ **Warning:** You are about to unsubscribe from ALL repositories.\n\nTo confirm, run:\n`/unsubscribe channel:<channel> confirm:CONFIRM`',
          ephemeral: true
        };
      }
      
      try {
        const removed = await removeSubscription(channelId, repo);
        
        if (!removed) {
          return {
            content: repo 
              ? `⚠️ No subscription found for **${repo}** in <#${channelId}>`
              : `⚠️ No subscriptions found for <#${channelId}>`,
            ephemeral: true
          };
        }
        
        return {
          content: repo 
            ? `✅ Unsubscribed <#${channelId}> from **${repo}**`
            : `✅ Unsubscribed <#${channelId}> from all repositories`,
        };
      } catch (err: any) {
        return { content: `❌ Failed: ${err.message}` };
      }
    }
  },

  // 6. List - with pagination
  list: {
    name: 'list',
    description: 'List all GitHub event subscriptions (Moderator+)',
    options: [
      {
        name: 'channel',
        description: 'Filter by specific channel',
        type: 7, // CHANNEL
        required: false
      }
    ],
    execute: async (interaction) => {
      const permCheck = checkPermission(interaction, 'list');
      if (!permCheck.allowed) {
        return { content: getPermissionErrorMessage('list', permCheck.required, permCheck.level), ephemeral: true };
      }
      
      const args = parseOptions(interaction);
      const channelFilter = args.channel as string;
      
      try {
        const subscriptions = await getAllSubscriptions();
        
        if (subscriptions.length === 0) {
          return { content: '📭 No active subscriptions found.' };
        }
        
        const filtered = channelFilter 
          ? subscriptions.filter(s => s.channelId === channelFilter)
          : subscriptions;
        
        if (filtered.length === 0) {
          return { content: `📭 No subscriptions found for <#${channelFilter}>.` };
        }
        
        // Group by channel
        const byChannel: Record<string, typeof subscriptions> = {};
        for (const sub of filtered) {
          if (!byChannel[sub.channelId]) byChannel[sub.channelId] = [];
          byChannel[sub.channelId].push(sub);
        }
        
        const lines = Object.entries(byChannel).map(([chanId, subs]) => {
          const repoList = subs.map(s => `• ${s.repo} (${s.events?.join(', ') || 'all'})`).join('\n');
          return `<#${chanId}>:\n${repoList}`;
        });
        
        const embed: DiscordEmbed = {
          title: '📋 Active Subscriptions',
          description: lines.join('\n\n').substring(0, 4000), // Discord limit
          color: EmbedColors.INFO,
          footer: { text: `${filtered.length} subscription(s)` }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: `❌ Failed: ${err.message}` };
      }
    }
  },

  // 7. Test - with permission check
  test: {
    name: 'test',
    description: 'Send a test notification (Moderator+)',
    execute: async (interaction) => {
      const permCheck = checkPermission(interaction, 'test');
      if (!permCheck.allowed) {
        return { content: getPermissionErrorMessage('test', permCheck.required, permCheck.level), ephemeral: true };
      }
      
      const embed: DiscordEmbed = {
        title: '🧪 Test Notification',
        description: 'This is a test from Meridus Bot!',
        color: EmbedColors.PRIMARY,
        fields: [
          { name: '✅ Status', value: 'Working correctly', inline: true },
          { name: '⏰ Time', value: new Date().toLocaleString(), inline: true }
        ],
        footer: { text: 'Meridus Bot' },
        timestamp: new Date().toISOString()
      };
      
      return { content: '✅ Test successful!', embeds: [embed] };
    }
  },

  // 8. Repos - with pagination support
  repos: {
    name: 'repos',
    description: 'List your GitHub repositories',
    options: [
      {
        name: 'page',
        description: 'Page number (default: 1)',
        type: 4, // INTEGER
        required: false
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'repos');
        if (remaining > 0) {
          return { content: formatCooldownMessage(remaining), ephemeral: true };
        }
        await setCooldown(userId, 'repos');
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const page = (args.page as number) || 1;
      
      try {
        const res = await octokit.rest.repos.listForAuthenticatedUser({ 
          per_page: 100,
          sort: 'updated'
        });
        
        const repos = res.data;
        if (repos.length === 0) return { content: '📂 No repositories found.' };
        
        const perPage = 10;
        const totalPages = Math.ceil(repos.length / perPage);
        const currentPage = Math.min(page, totalPages);
        
        const pageRepos = getPaginatedSlice(repos, currentPage, perPage);
        
        const repoList = pageRepos.map((r: any) => {
          const stars = r.stargazers_count || 0;
          const forks = r.forks_count || 0;
          const lang = r.language ? ` • ${r.language}` : '';
          return `• **${r.full_name}** ⭐ ${stars} 🍴 ${forks}${lang}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '📂 GitHub Repositories',
          description: repoList,
          color: EmbedColors.GITHUB,
          footer: { text: formatPaginationFooter(currentPage, totalPages, repos.length) }
        };
        
        // Store pagination state
        if (userId) {
          const stateId = storePaginationState({
            userId,
            command: 'repos',
            data: repos,
            currentPage,
            perPage,
            totalPages
          });
          
          return { 
            embeds: [embed],
            components: generatePaginationButtons(currentPage, totalPages, `repos:${stateId}`)
          };
        }
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'repos') };
      }
    }
  },

  // 9. Issues - with enhanced error handling
  issues: {
    name: 'issues',
    description: 'List GitHub issues across your repositories',
    options: [
      {
        name: 'repo',
        description: 'Filter by repository (owner/repo)',
        type: 3, // STRING
        required: false,
        autocomplete: true
      },
      {
        name: 'state',
        description: 'Issue state filter',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'open', value: 'open' },
          { name: 'closed', value: 'closed' },
          { name: 'all', value: 'all' }
        ]
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'issues');
        if (remaining > 0) return { content: formatCooldownMessage(remaining), ephemeral: true };
        await setCooldown(userId, 'issues');
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const repoFilter = args.repo as string;
      const state = (args.state as string) || 'open';
      
      try {
        let issues: any[] = [];
        
        if (repoFilter) {
          if (!isValidRepoFormat(repoFilter)) {
            return { content: '❌ Invalid repository format. Use: `owner/repo`' };
          }
          
          const [owner, repo] = repoFilter.split('/');
          const res = await octokit.rest.issues.listForRepo({
            owner, repo, state: state as any, per_page: 10
          });
          issues = res.data;
        } else {
          // Get from all repos
          const reposRes = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 20 });
          const repos = reposRes.data;
          
          const issuePromises = repos.map(async (repo: any) => {
            try {
              const res = await octokit.rest.issues.listForRepo({
                owner: repo.owner.login,
                repo: repo.name,
                state: state as any,
                per_page: 3
              });
              return res.data.map((i: any) => ({ ...i, repo_name: repo.full_name }));
            } catch { return []; }
          });
          
          const allIssues = await Promise.all(issuePromises);
          issues = allIssues.flat().slice(0, 10);
        }
        
        if (issues.length === 0) {
          return { content: `🐛 No ${state} issues found${repoFilter ? ` in ${repoFilter}` : ''}.` };
        }
        
        const issueList = issues.map((i: any) => {
          const repo = i.repo_name || i.repository?.full_name || '';
          const labels = i.labels?.map((l: any) => l.name).slice(0, 2).join(', ') || '';
          const stateEmoji = i.state === 'open' ? '🟢' : '🔴';
          return `${stateEmoji} **${repo}#${i.number}** ${i.title}${labels ? ` \`[${labels}]\`` : ''}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: `🐛 ${state.charAt(0).toUpperCase() + state.slice(1)} Issues`,
          description: issueList,
          color: state === 'open' ? EmbedColors.WARNING : EmbedColors.SUCCESS,
          footer: { text: `Showing ${issues.length} issues` }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'issues') };
      }
    }
  },

  // 10. Commits - with pagination
  commits: {
    name: 'commits',
    description: 'List recent GitHub commits',
    options: [
      {
        name: 'repo',
        description: 'Filter by repository (owner/repo)',
        type: 3, // STRING
        required: false,
        autocomplete: true
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'commits');
        if (remaining > 0) return { content: formatCooldownMessage(remaining), ephemeral: true };
        await setCooldown(userId, 'commits');
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const repoFilter = args.repo as string;
      
      try {
        let commits: any[] = [];
        
        if (repoFilter) {
          if (!isValidRepoFormat(repoFilter)) {
            return { content: '❌ Invalid repository format. Use: `owner/repo`' };
          }
          
          const [owner, repo] = repoFilter.split('/');
          const res = await octokit.rest.repos.listCommits({ owner, repo, per_page: 10 });
          commits = res.data.map((c: any) => ({ ...c, repo_name: repoFilter }));
        } else {
          const reposRes = await octokit.rest.repos.listForAuthenticatedUser({
            per_page: 5, sort: 'updated'
          });
          
          const commitPromises = reposRes.data.map(async (repo: any) => {
            try {
              const res = await octokit.rest.repos.listCommits({
                owner: repo.owner.login, repo: repo.name, per_page: 3
              });
              return res.data.map((c: any) => ({ ...c, repo_name: repo.full_name }));
            } catch { return []; }
          });
          
          const allCommits = await Promise.all(commitPromises);
          commits = allCommits.flat()
            .sort((a: any, b: any) => new Date(b.commit.author?.date || 0).getTime() - new Date(a.commit.author?.date || 0).getTime())
            .slice(0, 10);
        }
        
        if (commits.length === 0) {
          return { content: `📝 No commits found${repoFilter ? ` in ${repoFilter}` : ''}.` };
        }
        
        const commitList = commits.map((c: any) => {
          const msg = c.commit.message?.split('\n')[0]?.substring(0, 50) || 'No message';
          const sha = c.sha?.substring(0, 7);
          const repo = c.repo_name || 'unknown';
          const author = c.commit.author?.name || 'unknown';
          return `• **\`${sha}\`** [${repo}] ${msg}${c.commit.message?.length > 50 ? '...' : ''} - _${author}_`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '📝 Recent Commits',
          description: commitList,
          color: EmbedColors.INFO,
          footer: { text: `Showing ${commits.length} commits` }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'commits') };
      }
    }
  },

  // 11. Search - GitHub search
  search: {
    name: 'search',
    description: 'Search GitHub repositories, issues, or code',
    options: [
      {
        name: 'query',
        description: 'Search query',
        type: 3, // STRING
        required: true
      },
      {
        name: 'type',
        description: 'What to search for',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'repositories', value: 'repositories' },
          { name: 'issues', value: 'issues' },
          { name: 'code', value: 'code' }
        ]
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'search');
        if (remaining > 0) return { content: formatCooldownMessage(remaining), ephemeral: true };
        await setCooldown(userId, 'search');
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const query = args.query as string;
      const type = (args.type as string) || 'repositories';
      
      try {
        let results: any[] = [];
        let title = '';
        
        switch (type) {
          case 'repositories':
            const repoRes = await octokit.rest.search.repos({ q: query, per_page: 5 });
            results = repoRes.data.items;
            title = '🔍 Repository Search';
            break;
          case 'issues':
            const issueRes = await octokit.rest.search.issuesAndPullRequests({ q: query, per_page: 5 });
            results = issueRes.data.items;
            title = '🔍 Issue Search';
            break;
          case 'code':
            const codeRes = await octokit.rest.search.code({ q: query, per_page: 5 });
            results = codeRes.data.items;
            title = '🔍 Code Search';
            break;
        }
        
        if (results.length === 0) {
          return { content: `🔍 No ${type} found for query: **${query}**` };
        }
        
        let resultList = '';
        if (type === 'repositories') {
          resultList = results.map((r: any) => 
            `• **${r.full_name}** ⭐ ${r.stargazers_count} - ${r.description?.substring(0, 100) || 'No description'}${r.description?.length > 100 ? '...' : ''}`
          ).join('\n');
        } else if (type === 'issues') {
          resultList = results.map((i: any) => 
            `• **${i.repository_url?.split('/').slice(-2).join('/') || 'unknown'}#${i.number}** ${i.title} (${i.state})`
          ).join('\n');
        } else {
          resultList = results.map((c: any) => 
            `• **${c.repository.full_name}** - \`${c.path}\``
          ).join('\n');
        }
        
        const embed: DiscordEmbed = {
          title,
          description: resultList,
          color: EmbedColors.PRIMARY,
          footer: { text: `Query: ${query}` }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'search') };
      }
    }
  },

  // 12. PR - List pull requests
  pr: {
    name: 'pr',
    description: 'List pull requests for a repository',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo format)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'state',
        description: 'PR state',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'open', value: 'open' },
          { name: 'closed', value: 'closed' },
          { name: 'all', value: 'all' }
        ]
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'pr');
        if (remaining > 0) return { content: formatCooldownMessage(remaining), ephemeral: true };
        await setCooldown(userId, 'pr');
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const state = (args.state as string) || 'open';
      
      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }
      
      const [owner, repoName] = repo.split('/');
      
      try {
        const res = await octokit.rest.pulls.list({
          owner, repo: repoName, state: state as any, per_page: 10
        });
        
        const prs = res.data;
        
        if (prs.length === 0) {
          return { content: `🔀 No ${state} pull requests in **${repo}**.` };
        }
        
        const prList = prs.map((p: any) => {
          const draft = p.draft ? '📝 ' : '';
          const merged = p.merged_at ? '🔀 ' : p.state === 'closed' ? '❌ ' : '🟢 ';
          const emoji = p.merged_at ? '🔀' : draft || merged;
          return `${emoji} **#${p.number}** ${p.title} by ${p.user.login}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: `🔀 Pull Requests in ${repo}`,
          description: prList,
          color: EmbedColors.PRIMARY,
          footer: { text: `${prs.length} ${state} PRs` }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'pr') };
      }
    }
  },

  // 13. Settings - User preferences
  settings: {
    name: 'settings',
    description: 'Manage your bot settings',
    options: [
      {
        name: 'action',
        description: 'Setting to change',
        type: 3, // STRING
        required: true,
        choices: [
          { name: 'View current settings', value: 'view' },
          { name: 'Toggle DM notifications', value: 'dm' },
          { name: 'Set digest mode', value: 'digest' },
          { name: 'Enable silent mode', value: 'silent_on' },
          { name: 'Disable silent mode', value: 'silent_off' },
          { name: 'Mute repository', value: 'mute' },
          { name: 'Unmute repository', value: 'unmute' },
          { name: 'Set GitHub username', value: 'github_user' }
        ]
      },
      {
        name: 'value',
        description: 'Value for the setting',
        type: 3, // STRING
        required: false
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (!userId) return { content: '❌ Could not identify user.' };
      
      const args = parseOptions(interaction);
      const action = args.action as string;
      const value = (args.value as string) || '';
      
      const prefs = await getUserPreferences(userId);
      
      switch (action) {
        case 'view': {
          const silentStatus = prefs.silentMode?.enabled 
            ? `🔇 Until ${new Date(prefs.silentMode.until).toLocaleString()}` 
            : '🔊 Off';
          
          const embed: DiscordEmbed = {
            title: '⚙️ Your Settings',
            color: EmbedColors.INFO,
            fields: [
              { name: '📩 DM Notifications', value: prefs.dmNotifications ? '✅ Enabled' : '❌ Disabled', inline: true },
              { name: '📊 Digest Mode', value: prefs.digestMode, inline: true },
              { name: '🔇 Silent Mode', value: silentStatus, inline: true },
              { name: '🔕 Muted Repos', value: prefs.mutedRepos.length > 0 ? prefs.mutedRepos.join(', ') : 'None', inline: false }
            ]
          };
          return { embeds: [embed] };
        }
        
        case 'dm': {
          const newVal = !prefs.dmNotifications;
          await toggleDMNotifications(userId, newVal);
          return { content: `📩 DM notifications ${newVal ? '✅ enabled' : '❌ disabled'}.` };
        }
        
        case 'digest': {
          const mode = value as 'instant' | 'hourly' | 'daily';
          if (!['instant', 'hourly', 'daily'].includes(mode)) {
            return { content: '❌ Invalid mode. Use: instant, hourly, or daily' };
          }
          await setDigestMode(userId, mode);
          return { content: `📊 Digest mode set to **${mode}**.` };
        }
        
        case 'silent_on': {
          const duration = parseInt(value) || 60;
          await setSilentMode(userId, true, duration);
          return { content: `🔇 Silent mode enabled for ${duration} minutes.` };
        }
        
        case 'silent_off': {
          await setSilentMode(userId, false);
          return { content: '🔊 Silent mode disabled.' };
        }
        
        case 'mute': {
          if (!value) return { content: '❌ Please specify a repository to mute.' };
          await muteRepository(userId, value);
          return { content: `🔕 Muted **${value}**.` };
        }
        
        case 'unmute': {
          if (!value) return { content: '❌ Please specify a repository to unmute.' };
          await unmuteRepository(userId, value);
          return { content: `🔔 Unmuted **${value}**.` };
        }
        
        case 'github_user': {
          if (!value) return { content: '❌ Please specify your GitHub username.' };
          await setGitHubUsername(userId, value);
          return { content: `🔗 GitHub username set to **${value}**.` };
        }
        
        default:
          return { content: '❌ Unknown action.' };
      }
    }
  },

  // 14. MyStats - User statistics
  mystats: {
    name: 'mystats',
    description: 'Show your GitHub activity statistics',
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (userId) {
        const remaining = await checkCooldown(userId, 'mystats');
        if (remaining > 0) return { content: formatCooldownMessage(remaining), ephemeral: true };
        await setCooldown(userId, 'mystats');
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      try {
        const user = await octokit.rest.users.getAuthenticated();
        const repos = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 1 });
        
        const embed: DiscordEmbed = {
          title: `📊 Stats for ${user.data.login}`,
          color: EmbedColors.PRIMARY,
          thumbnail: { url: user.data.avatar_url },
          fields: [
            { name: '📁 Public Repos', value: user.data.public_repos.toString(), inline: true },
            { name: '👥 Followers', value: user.data.followers.toString(), inline: true },
            { name: '👤 Following', value: user.data.following.toString(), inline: true },
            { name: '📅 Joined', value: new Date(user.data.created_at).toLocaleDateString(), inline: true },
            { name: '🏢 Company', value: user.data.company || 'N/A', inline: true },
            { name: '📍 Location', value: user.data.location || 'N/A', inline: true }
          ]
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'user') };
      }
    }
  },

  // 15. Webhook - Health check
  webhook: {
    name: 'webhook',
    description: 'Check webhook status for a repository (Moderator+)',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      }
    ],
    execute: async (interaction) => {
      const permCheck = checkPermission(interaction, 'webhook');
      if (!permCheck.allowed) {
        return { content: getPermissionErrorMessage('webhook', permCheck.required, permCheck.level), ephemeral: true };
      }
      
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const repo = args.repo as string;
      
      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }
      
      const [owner, repoName] = repo.split('/');
      
      try {
        const hooks = await octokit.rest.repos.listWebhooks({ owner, repo: repoName });
        const subs = await getRepoSubscriptions(repo);
        
        let status = '';
        if (hooks.data.length === 0) {
          status = '⚠️ No webhooks configured';
        } else {
          const meridusHook = hooks.data.find((h: any) => 
            h.config?.url?.includes('meridusdev.in.th')
          );
          status = meridusHook 
            ? `✅ Meridus webhook configured (${meridusHook.events?.length || 0} events)`
            : `⚠️ ${hooks.data.length} webhook(s) but none for Meridus`;
        }
        
        const embed: DiscordEmbed = {
          title: `🔗 Webhook Status: ${repo}`,
          color: hooks.data.length > 0 ? EmbedColors.SUCCESS : EmbedColors.WARNING,
          fields: [
            { name: 'Webhook Status', value: status, inline: false },
            { name: '📡 Discord Subscriptions', value: `${subs.length} channel(s) subscribed`, inline: true }
          ]
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'webhook') };
      }
    }
  },

  // 16. Export - Subscription export
  export: {
    name: 'export',
    description: 'Export all subscriptions as JSON (Admin only)',
    execute: async (interaction) => {
      const permCheck = checkPermission(interaction, 'export');
      if (!permCheck.allowed) {
        return { content: getPermissionErrorMessage('export', permCheck.required, permCheck.level), ephemeral: true };
      }
      
      try {
        const subs = await getAllSubscriptions();
        const data = {
          exported_at: new Date().toISOString(),
          guild_id: interaction.guild_id,
          subscriptions: subs
        };
        
        return {
          content: `📤 **${subs.length} subscription(s) exported.**\n\`\`\`json\n${JSON.stringify(data, null, 2).substring(0, 1900)}\`\`\``,
          ephemeral: true
        };
      } catch (err: any) {
        return { content: `❌ Export failed: ${err.message}` };
      }
    }
  },

  // 17. Actions - GitHub Actions status
  actions: {
    name: 'actions',
    description: 'Show recent GitHub Actions workflow runs',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      const args = parseOptions(interaction);
      const repo = args.repo as string;
      
      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }
      
      const [owner, repoName] = repo.split('/');
      
      try {
        const runs = await octokit.rest.actions.listWorkflowRunsForRepo({
          owner, repo: repoName, per_page: 5
        });
        
        if (runs.data.workflow_runs.length === 0) {
          return { content: `🔧 No recent workflow runs in **${repo}**.` };
        }
        
        const runList = runs.data.workflow_runs.map((r: any) => {
          const statusEmoji = r.conclusion === 'success' ? '✅' : r.conclusion === 'failure' ? '❌' : '⏳';
          return `${statusEmoji} **${r.name}** - ${r.head_branch} (${r.event})`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: `🔧 Recent Actions in ${repo}`,
          description: runList,
          color: EmbedColors.INFO,
          footer: { text: 'Last 5 workflow runs' }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'actions') };
      }
    }
  },

  // 19. Branch - List repository branches
  branch: {
    name: 'branch',
    description: 'List repository branches',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'limit',
        description: 'Number of branches to show (max 20)',
        type: 4, // INTEGER
        required: false
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const limit = Math.min((args.limit as number) || 10, 20);

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        const res = await octokit.rest.repos.listBranches({ owner, repo: repoName, per_page: limit });

        if (res.data.length === 0) {
          return { content: `🌿 No branches found in **${repo}**.` };
        }

        const branchList = res.data.map((b: { name: string; protected: boolean }) =>
          `• \`${b.name}\`${b.protected ? ' 🔒' : ''}`
        ).join('\n');

        const embed: DiscordEmbed = {
          title: `🌿 Branches in ${repo}`,
          description: branchList,
          color: EmbedColors.GITHUB,
          footer: { text: `${res.data.length} branch(es)` }
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'branch') };
      }
    }
  },

  // 20. Contributors - Show repository contributors
  contributors: {
    name: 'contributors',
    description: 'Show repository contributors',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'limit',
        description: 'Number of contributors to show (max 20)',
        type: 4, // INTEGER
        required: false
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const limit = Math.min((args.limit as number) || 10, 20);

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        const res = await octokit.rest.repos.listContributors({ owner, repo: repoName, per_page: limit });

        if (!res.data || res.data.length === 0) {
          return { content: `👥 No contributors found for **${repo}**.` };
        }

        const list = (res.data as { login?: string; contributions: number }[]).map((c, i) =>
          `${i + 1}. **${c.login ?? 'unknown'}** — ${c.contributions} commit(s)`
        ).join('\n');

        const embed: DiscordEmbed = {
          title: `👥 Contributors in ${repo}`,
          description: list,
          color: EmbedColors.PRIMARY,
          footer: { text: `Top ${res.data.length} contributor(s)` }
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'contributors') };
      }
    }
  },

  // 21. Issue - Subcommands for issue management
  issue: {
    name: 'issue',
    description: 'Manage GitHub issues',
    options: [
      {
        name: 'create',
        description: 'Create a new issue',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'repo',
            description: 'Repository (owner/repo)',
            type: 3, // STRING
            required: true,
            autocomplete: true
          },
          {
            name: 'title',
            description: 'Issue title',
            type: 3, // STRING
            required: true
          },
          {
            name: 'body',
            description: 'Issue body / description',
            type: 3, // STRING
            required: false
          },
          {
            name: 'labels',
            description: 'Comma-separated labels',
            type: 3, // STRING
            required: false
          }
        ]
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      // Resolve subcommand options one level deep
      const subcommand = interaction.data?.options?.[0];
      if (!subcommand || subcommand.name !== 'create') {
        return { content: '❌ Unknown subcommand. Use `/issue create`.' };
      }

      const subOptions: Record<string, string> = {};
      for (const opt of subcommand.options ?? []) {
        if (opt.value !== undefined) subOptions[opt.name] = String(opt.value);
      }

      const repo = subOptions.repo ?? '';
      const title = subOptions.title ?? '';
      const body = subOptions.body ?? '';
      const labelsInput = subOptions.labels ?? '';

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }
      if (!title) {
        return { content: '❌ Issue title is required.' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        const labels = labelsInput ? labelsInput.split(',').map(l => l.trim()).filter(l => l) : undefined;
        const res = await octokit.rest.issues.create({ owner, repo: repoName, title, body, labels });

        const labelDisplay = res.data.labels?.map((l) => (typeof l === 'string' ? l : l.name)).filter(Boolean).join(', ') || 'None';
        const embed: DiscordEmbed = {
          title: '✅ Issue Created',
          description: `**[${res.data.title}](${res.data.html_url})**`,
          color: EmbedColors.SUCCESS,
          fields: [
            { name: '📁 Repository', value: repo, inline: true },
            { name: '#️⃣ Number', value: `#${res.data.number}`, inline: true },
            { name: '🏷️ Labels', value: labelDisplay, inline: true }
          ]
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'issue create') };
      }
    }
  },

  // 22. Merge - Merge a pull request
  merge: {
    name: 'merge',
    description: 'Merge a pull request',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'pr_number',
        description: 'Pull request number',
        type: 4, // INTEGER
        required: true
      },
      {
        name: 'method',
        description: 'Merge method (default: merge)',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'merge', value: 'merge' },
          { name: 'squash', value: 'squash' },
          { name: 'rebase', value: 'rebase' }
        ]
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const prNumber = args.pr_number as number;
      const method = (args.method as string) || 'merge';

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        const res = await octokit.rest.pulls.merge({
          owner,
          repo: repoName,
          pull_number: prNumber,
          merge_method: method as 'merge' | 'squash' | 'rebase'
        });

        const embed: DiscordEmbed = {
          title: '✅ Pull Request Merged',
          description: res.data.message ?? `PR #${prNumber} merged successfully.`,
          color: EmbedColors.SUCCESS,
          fields: [
            { name: '📁 Repository', value: repo, inline: true },
            { name: '#️⃣ PR', value: `#${prNumber}`, inline: true },
            { name: '🔀 Method', value: method, inline: true }
          ]
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'merge') };
      }
    }
  },

  // 23. Release - List repository releases
  release: {
    name: 'release',
    description: 'List repository releases',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'limit',
        description: 'Number of releases to show (max 10)',
        type: 4, // INTEGER
        required: false
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const limit = Math.min((args.limit as number) || 5, 10);

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        const res = await octokit.rest.repos.listReleases({ owner, repo: repoName, per_page: limit });

        if (res.data.length === 0) {
          return { content: `🚀 No releases found for **${repo}**.` };
        }

        const releaseList = res.data.map((r: { tag_name: string; name: string | null; html_url: string; prerelease: boolean; published_at: string | null }) => {
          const pre = r.prerelease ? ' `pre-release`' : '';
          const date = r.published_at ? new Date(r.published_at).toLocaleDateString() : 'unknown date';
          return `• **[${r.tag_name}](${r.html_url})**${pre} — ${r.name ?? r.tag_name} _(${date})_`;
        }).join('\n');

        const embed: DiscordEmbed = {
          title: `🚀 Releases for ${repo}`,
          description: releaseList,
          color: EmbedColors.SUCCESS,
          footer: { text: `Latest ${res.data.length} release(s)` }
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'release') };
      }
    }
  },

  // 24. Repo - Subcommands for repository information
  repo: {
    name: 'repo',
    description: 'Repository management commands',
    options: [
      {
        name: 'info',
        description: 'Show detailed repository information',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'repo',
            description: 'Repository (owner/repo)',
            type: 3, // STRING
            required: true,
            autocomplete: true
          }
        ]
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const subcommand = interaction.data?.options?.[0];
      if (!subcommand || subcommand.name !== 'info') {
        return { content: '❌ Unknown subcommand. Use `/repo info`.' };
      }

      const subOptions: Record<string, string> = {};
      for (const opt of subcommand.options ?? []) {
        if (opt.value !== undefined) subOptions[opt.name] = String(opt.value);
      }

      const repoArg = subOptions.repo ?? '';

      if (!isValidRepoFormat(repoArg)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repoArg.split('/');

      try {
        const { data: r } = await octokit.rest.repos.get({ owner, repo: repoName });

        const embed: DiscordEmbed = {
          title: `📁 ${r.full_name}`,
          description: r.description ?? 'No description provided.',
          color: EmbedColors.GITHUB,
          fields: [
            { name: '⭐ Stars', value: r.stargazers_count.toString(), inline: true },
            { name: '🍴 Forks', value: r.forks_count.toString(), inline: true },
            { name: '👁️ Watchers', value: r.watchers_count.toString(), inline: true },
            { name: '💻 Language', value: r.language ?? 'N/A', inline: true },
            { name: '🔓 Visibility', value: r.private ? 'Private' : 'Public', inline: true },
            { name: '🐛 Open Issues', value: r.open_issues_count.toString(), inline: true },
            { name: '📅 Created', value: new Date(r.created_at).toLocaleDateString(), inline: true },
            { name: '🔄 Updated', value: new Date(r.updated_at).toLocaleDateString(), inline: true },
            { name: '🌿 Default Branch', value: r.default_branch, inline: true }
          ],
          footer: { text: r.html_url }
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'repo info') };
      }
    }
  },

  // 25. Star - Star a GitHub repository
  star: {
    name: 'star',
    description: 'Star a GitHub repository',
    options: [
      {
        name: 'repo',
        description: 'Repository to star (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        await octokit.rest.activity.starRepoForAuthenticatedUser({ owner, repo: repoName });

        return {
          content: `⭐ Successfully starred **${repo}**!`,
        };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'star') };
      }
    }
  },

  // 26. User - Subcommands for account linking
  user: {
    name: 'user',
    description: 'Manage your account link with projectmeridus',
    options: [
      {
        name: 'link',
        description: 'Link your Discord account with projectmeridus',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'token',
            description: 'GitHub personal access token (optional — usually linked via website)',
            type: 3, // STRING
            required: false
          }
        ]
      },
      {
        name: 'status',
        description: 'Check your account link status',
        type: 1, // SUB_COMMAND
      },
      {
        name: 'unlink',
        description: 'Unlink your Discord account from projectmeridus',
        type: 1, // SUB_COMMAND
      }
    ],
    execute: async (interaction) => {
      const userId = getUserId(interaction);
      if (!userId) return { content: '❌ Could not identify user.' };

      const subcommandName = interaction.data?.options?.[0]?.name;

      switch (subcommandName) {
        case 'link': {
          // Check if user provided a token directly (advanced/admin use)
          const linkSubOpts = interaction.data?.options?.[0]?.options ?? [];
          const providedToken = linkSubOpts.find(o => o.name === 'token')?.value as string | undefined;

          if (providedToken) {
            // Token provided — store it via linkUser
            await linkUser(userId, providedToken);
            return {
              content: `✅ **GitHub token linked successfully.**\nYour account is now connected to projectmeridus.`,
              ephemeral: true
            };
          }

          // No token — already linked?
          const alreadyLinked = await hasLinkedGitHub(userId);
          if (alreadyLinked) {
            return {
              content: `✅ **Account already linked.**\nUse \`/user status\` to view details or \`/user unlink\` to remove the link.`,
              ephemeral: true
            };
          }

          return {
            content: `🔗 **Link your Discord account with projectmeridus**\n\nVisit the link below and sign in with both Discord and GitHub:\n🌐 <https://www.meridusdev.in.th>\n\nOnce linked, your GitHub token will be securely stored.`,
            ephemeral: true
          };
        }

        case 'status': {
          const linked = await hasLinkedGitHub(userId);
          if (!linked) {
            return {
              content: `❌ **Not linked.** Use \`/user link\` to connect your GitHub account.`,
              ephemeral: true
            };
          }

          const userLink = await getUserLink(userId);
          const embed: DiscordEmbed = {
            title: '🔗 Account Link Status',
            color: EmbedColors.SUCCESS,
            fields: [
              { name: '✅ GitHub', value: userLink?.githubUsername ?? 'Linked', inline: true },
              { name: '🔷 Vercel', value: userLink?.vercelUsername ?? 'Not linked', inline: true },
              { name: '📅 Linked At', value: userLink?.linkedAt ? new Date(userLink.linkedAt).toLocaleDateString() : 'Unknown', inline: true }
            ]
          };

          return { embeds: [embed], ephemeral: true };
        }

        case 'unlink': {
          const removed = await unlinkUser(userId);
          if (!removed) {
            return { content: '⚠️ No linked account found.', ephemeral: true };
          }
          return { content: '✅ Your account has been unlinked from projectmeridus.', ephemeral: true };
        }

        default:
          return { content: '❌ Unknown subcommand. Use `/user link`, `/user status`, or `/user unlink`.', ephemeral: true };
      }
    }
  },

  // 27. Watch - Watch or unwatch a repository
  watch: {
    name: 'watch',
    description: 'Watch or unwatch a GitHub repository',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'action',
        description: 'Watch or unwatch',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'watch', value: 'watch' },
          { name: 'unwatch', value: 'unwatch' }
        ]
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const action = (args.action as string) || 'watch';

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        if (action === 'unwatch') {
          await octokit.rest.activity.deleteRepoSubscription({ owner, repo: repoName });
          return { content: `🔕 You are no longer watching **${repo}**.` };
        }

        await octokit.rest.activity.setRepoSubscription({
          owner,
          repo: repoName,
          subscribed: true,
          ignored: false
        });

        return { content: `👁️ You are now watching **${repo}** for all events.` };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'watch') };
      }
    }
  },

  // 28. Workflow - GitHub Actions workflow management
  workflow: {
    name: 'workflow',
    description: 'GitHub Actions workflow management',
    options: [
      {
        name: 'repo',
        description: 'Repository (owner/repo)',
        type: 3, // STRING
        required: true,
        autocomplete: true
      },
      {
        name: 'action',
        description: 'Action to perform',
        type: 3, // STRING
        required: false,
        choices: [
          { name: 'list', value: 'list' },
          { name: 'runs', value: 'runs' }
        ]
      }
    ],
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };

      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };

      const args = parseOptions(interaction);
      const repo = args.repo as string;
      const action = (args.action as string) || 'list';

      if (!isValidRepoFormat(repo)) {
        return { content: '❌ Invalid repository format. Use: `owner/repo`' };
      }

      const [owner, repoName] = repo.split('/');

      try {
        if (action === 'runs') {
          const runsRes = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner, repo: repoName, per_page: 5
          });

          if (runsRes.data.workflow_runs.length === 0) {
            return { content: `⚙️ No recent workflow runs in **${repo}**.` };
          }

          const runList = runsRes.data.workflow_runs.map((r) => {
            const statusEmoji = r.conclusion === 'success' ? '✅' : r.conclusion === 'failure' ? '❌' : r.status === 'in_progress' ? '⏳' : '⏸️';
            return `${statusEmoji} **${r.name ?? 'Unnamed'}** — \`${r.head_branch ?? 'unknown'}\` (${r.event})`;
          }).join('\n');

          const embed: DiscordEmbed = {
            title: `⚙️ Recent Workflow Runs — ${repo}`,
            description: runList,
            color: EmbedColors.INFO,
            footer: { text: 'Last 5 runs' }
          };

          return { embeds: [embed] };
        }

        // Default: list workflows
        const workflowsRes = await octokit.rest.actions.listRepoWorkflows({ owner, repo: repoName });

        if (workflowsRes.data.total_count === 0) {
          return { content: `⚙️ No workflows found in **${repo}**.` };
        }

        const workflowList = workflowsRes.data.workflows.map((w: { name: string; state: string; path: string }) =>
          `• **${w.name}** \`${w.state}\` — \`${w.path}\``
        ).join('\n');

        const embed: DiscordEmbed = {
          title: `⚙️ Workflows in ${repo}`,
          description: workflowList,
          color: EmbedColors.INFO,
          footer: { text: `${workflowsRes.data.total_count} workflow(s)` }
        };

        return { embeds: [embed] };
      } catch (err: unknown) {
        return { content: formatErrorMessage(err, 'workflow') };
      }
    }
  },

  // 18. Reviews - Code review requests
  reviews: {
    name: 'reviews',
    description: 'Show pull requests awaiting your review',
    execute: async (interaction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) return { content: access.message };
      
      const octokit = await getUserOctokit(interaction);
      if (!octokit) return { content: '❌ GitHub authentication failed.' };
      
      try {
        const user = await octokit.rest.users.getAuthenticated();
        const searchRes = await octokit.rest.search.issuesAndPullRequests({
          q: `is:pr is:open review-requested:${user.data.login}`,
          per_page: 10
        });
        
        const prs = searchRes.data.items;
        
        if (prs.length === 0) {
          return { content: '🎉 No pull requests awaiting your review!' };
        }
        
        const prList = prs.map((p: any) => {
          const repo = p.repository_url?.split('/').slice(-2).join('/') || 'unknown';
          return `• **${repo}#${p.number}** ${p.title}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '👀 Review Requests',
          description: prList,
          color: EmbedColors.WARNING,
          footer: { text: `${prs.length} PRs awaiting review` }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        return { content: formatErrorMessage(err, 'reviews') };
      }
    }
  },
};

// Get command definitions for Discord registration
export function getCommandDefinitions() {
  return Object.values(commands).map(cmd => ({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options || [],
    default_member_permissions: getPermissionForCommand(cmd.name)
  }));
}

// Get permission integer for command
function getPermissionForCommand(commandName: string): string | undefined {
  // Map commands to Discord permission bitfields
  const permMap: Record<string, string> = {
    'subscribe': '8', // Administrator
    'unsubscribe': '8',
    'list': '8192', // Manage Messages
    'test': '8192',
    'webhook': '8192',
    'export': '8',
    'import': '8',
  };
  return permMap[commandName];
}
