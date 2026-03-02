// lib/discord/commands.ts
// Discord bot command handlers for interaction endpoint

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
  getSubscriptionCount 
} from "@/app/lib/subscriptions";
import { getUserLink, hasLinkedGitHub } from "@/app/lib/userLinks";
import { Octokit } from "octokit";

// Environment configuration - fallback server token
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

// Get Octokit for a Discord user (using their linked GitHub token)
async function getUserOctokit(interaction: DiscordInteraction): Promise<Octokit | null> {
  const discordUserId = interaction.member?.user?.id || interaction.user?.id;
  
  if (!discordUserId) {
    return null;
  }
  
  // Try to get the user's linked GitHub token
  const userLink = await getUserLink(discordUserId);
  if (userLink) {
    return new Octokit({ auth: userLink.githubToken });
  }
  
  // Fallback to server token if available
  if (GITHUB_TOKEN) {
    return new Octokit({ auth: GITHUB_TOKEN });
  }
  
  return null;
}

// Check if user has GitHub access
async function checkGitHubAccess(interaction: DiscordInteraction): Promise<{ ok: boolean; message?: string }> {
  const discordUserId = interaction.member?.user?.id || interaction.user?.id;
  
  if (!discordUserId) {
    return { ok: false, message: '❌ Could not identify Discord user.' };
  }
  
  const hasLink = await hasLinkedGitHub(discordUserId);
  if (!hasLink && !GITHUB_TOKEN) {
    return { 
      ok: false, 
      message: '🔒 **GitHub not linked.**\n\nPlease log in to the website with both GitHub and Discord:\n' +
        '🔗 <https://www.meridusdev.in.th>' 
    };
  }
  
  return { ok: true };
}

// Command registry
export const commands: Record<string, DiscordCommand> = {
  // 1. Ping - Simple health check
  ping: {
    name: 'ping',
    description: 'Check if the bot is online and responsive',
    execute: async () => {
      const latency = Date.now();
      return {
        content: `🏓 Pong! Bot is online.\n⏱️ Latency: ${Date.now() - latency}ms`,
      };
    }
  },

  // 2. Status - Bot status with uptime and stats
  status: {
    name: 'status',
    description: 'Show bot status, uptime, and system information',
    execute: async () => {
      const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : 0;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      
      const uptimeStr = days > 0 
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : `${hours}h ${minutes}m ${seconds}s`;
      
      // Get subscription count directly from storage
      const subscriptionCount = await getSubscriptionCount();
      
      const embed: DiscordEmbed = {
        title: '📊 Meridus Bot Status',
        description: 'Real-time system status and statistics',
        color: EmbedColors.SUCCESS,
        fields: [
          {
            name: '🔵 Status',
            value: 'Online',
            inline: true
          },
          {
            name: '⏱️ Uptime',
            value: uptimeStr,
            inline: true
          },
          {
            name: '📡 Subscriptions',
            value: subscriptionCount.toString(),
            inline: true
          },
        ],
        footer: {
          text: 'DeltCroX DevHub • Development Hub and Productivity Tools'
        },
        timestamp: new Date().toISOString()
      };
      
      return { embeds: [embed] };
    }
  },

  // 3. Subscribe - Subscribe channel to GitHub repo events
  subscribe: {
    name: 'subscribe',
    description: 'Subscribe a channel to GitHub repository events',
    options: [
      {
        name: 'channel',
        description: 'The channel to send notifications to',
        type: 7, // CHANNEL
        required: true
      },
      {
        name: 'repo',
        description: 'GitHub repository in format owner/repo (e.g., deltcrosx1024/projectmeridus)',
        type: 3, // STRING
        required: true
      },
      {
        name: 'events',
        description: 'Events to subscribe to (default: push,issues,pr,release)',
        type: 3, // STRING
        required: false
      }
    ],
    execute: async (interaction: DiscordInteraction) => {
      const args = parseOptions(interaction);
      const channelId = args.channel as string;
      const repo = args.repo as string;
      const eventsStr = (args.events as string) || 'push,issues,pull_request,release';
      
      // Validate repo format
      if (!repo.includes('/')) {
        return {
          content: '❌ Invalid repository format. Use: `owner/repo` (e.g., `deltcrosx1024/projectmeridus`)'
        };
      }
      
      const events = eventsStr.split(',').map(e => e.trim()).filter(e => e);
      
      try {
        await addSubscription(channelId, repo, events, interaction.guild_id);
        
        const embed: DiscordEmbed = {
          title: '✅ Subscription Added',
          description: `This channel will now receive notifications for **${repo}**`,
          color: EmbedColors.SUCCESS,
          fields: [
            {
              name: '📁 Repository',
              value: repo,
              inline: true
            },
            {
              name: '🔔 Events',
              value: events.join(', '),
              inline: true
            }
          ]
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        console.error('[Subscribe] Error:', err);
        return {
          content: `❌ Failed to subscribe: ${err.message || 'Unknown error'}`,
        };
      }
    }
  },

  // 4. Unsubscribe - Unsubscribe from repo events
  unsubscribe: {
    name: 'unsubscribe',
    description: 'Unsubscribe a channel from GitHub repository events',
    options: [
      {
        name: 'channel',
        description: 'The channel to unsubscribe',
        type: 7, // CHANNEL
        required: true
      },
      {
        name: 'repo',
        description: 'Repository to unsubscribe from (leave empty to unsubscribe all)',
        type: 3, // STRING
        required: false
      }
    ],
    execute: async (interaction: DiscordInteraction) => {
      const args = parseOptions(interaction);
      const channelId = args.channel as string;
      const repo = (args.repo as string) || '';
      
      try {
        const removed = await removeSubscription(channelId, repo);
        
        if (!removed) {
          return {
            content: repo 
              ? `⚠️ No subscription found for **${repo}** in <#${channelId}>`
              : `⚠️ No subscriptions found for <#${channelId}>`,
          };
        }
        
        if (repo) {
          return {
            content: `✅ Unsubscribed <#${channelId}> from **${repo}**`,
          };
        } else {
          return {
            content: `✅ Unsubscribed <#${channelId}> from all repositories`,
          };
        }
      } catch (err: any) {
        console.error('[Unsubscribe] Error:', err);
        return {
          content: `❌ Failed to unsubscribe: ${err.message || 'Unknown error'}`,
        };
      }
    }
  },

  // 5. List - List all subscriptions
  list: {
    name: 'list',
    description: 'List all GitHub event subscriptions',
    options: [
      {
        name: 'channel',
        description: 'Filter by specific channel',
        type: 7, // CHANNEL
        required: false
      }
    ],
    execute: async (interaction: DiscordInteraction) => {
      const args = parseOptions(interaction);
      const channelFilter = args.channel as string;
      
      try {
        const subscriptions = await getAllSubscriptions();
        
        if (subscriptions.length === 0) {
          return {
            content: '📭 No active subscriptions found.',
          };
        }
        
        // Filter by channel if specified
        const filtered = channelFilter 
          ? subscriptions.filter((sub) => sub.channelId === channelFilter)
          : subscriptions;
        
        if (filtered.length === 0) {
          return {
            content: `📭 No subscriptions found for <#${channelFilter}>.`,
          };
        }
        
        // Group by channel
        const byChannel: Record<string, typeof subscriptions> = {};
        for (const sub of filtered) {
          if (!byChannel[sub.channelId]) {
            byChannel[sub.channelId] = [];
          }
          byChannel[sub.channelId].push(sub);
        }
        
        const lines = Object.entries(byChannel).map(([chanId, subs]) => {
          const repoList = subs.map((s) => `  • ${s.repo} (${s.events?.join(', ') || 'all'})`).join('\n');
          return `<#${chanId}>:\n${repoList}`;
        });
        
        const embed: DiscordEmbed = {
          title: '📋 Active Subscriptions',
          description: lines.join('\n\n'),
          color: EmbedColors.INFO,
          footer: {
            text: `${filtered.length} subscription(s) total`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        console.error('[List] Error:', err);
        return {
          content: `❌ Failed to list subscriptions: ${err.message || 'Unknown error'}`,
        };
      }
    }
  },

  // 6. Test - Send test notification
  test: {
    name: 'test',
    description: 'Send a test notification to verify the bot is working',
    execute: async () => {
      const embed: DiscordEmbed = {
        title: '🧪 Test Notification',
        description: 'This is a test notification from Meridus Bot!',
        color: EmbedColors.PRIMARY,
        fields: [
          {
            name: '✅ Status',
            value: 'Bot is working correctly',
            inline: true
          },
          {
            name: '⏰ Time',
            value: new Date().toLocaleString(),
            inline: true
          }
        ],
        footer: {
          text: 'Meridus Bot • DeltCroX DevHub'
        },
        timestamp: new Date().toISOString()
      };
      
      return { 
        content: '✅ Test successful! The bot is working correctly.',
        embeds: [embed] 
      };
    }
  },

  // 7. Repos - List GitHub repos
  repos: {
    name: 'repos',
    description: 'List your GitHub repositories',
    execute: async (interaction: DiscordInteraction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) {
        return { content: access.message };
      }
      
      const octokit = await getUserOctokit(interaction);
      
      if (!octokit) {
        return {
          content: '❌ GitHub authentication failed.',
        };
      }
      
      try {
        const res = await octokit.rest.repos.listForAuthenticatedUser({ 
          per_page: 100,
          sort: 'updated'
        });
        
        const repos = res.data;
        
        if (repos.length === 0) {
          return {
            content: '📂 No repositories found.',
          };
        }
        
        const topRepos = repos.slice(0, 10);
        const repoList = topRepos.map((r: any) => {
          const stars = r.stargazers_count || 0;
          const forks = r.forks_count || 0;
          const language = r.language ? ` • ${r.language}` : '';
          return `• **${r.full_name}** ⭐ ${stars} 🍴 ${forks}${language}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '📂 GitHub Repositories',
          description: repoList,
          color: EmbedColors.GITHUB,
          footer: {
            text: `Showing ${topRepos.length} of ${repos.length} repositories`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        console.error('[Repos] Error:', err);
        if (err.status === 401) {
          return {
            content: '🔒 GitHub token is invalid or expired. Please re-link your account on the website.',
          };
        }
        return {
          content: `❌ Failed to fetch repositories: ${err.message || 'Unknown error'}`,
        };
      }
    }
  },

  // 8. Issues - List GitHub issues
  issues: {
    name: 'issues',
    description: 'List GitHub issues across your repositories',
    options: [
      {
        name: 'repo',
        description: 'Filter by specific repository (owner/repo format)',
        type: 3, // STRING
        required: false
      }
    ],
    execute: async (interaction: DiscordInteraction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) {
        return { content: access.message };
      }
      
      const octokit = await getUserOctokit(interaction);
      
      if (!octokit) {
        return {
          content: '❌ GitHub authentication failed.',
        };
      }
      
      const args = parseOptions(interaction);
      const repoFilter = args.repo as string;
      
      try {
        let issues: any[] = [];
        
        if (repoFilter) {
          // Get issues from specific repo
          const [owner, repo] = repoFilter.split('/');
          if (!owner || !repo) {
            return {
              content: '❌ Invalid repository format. Use: `owner/repo`',
            };
          }
          
          const res = await octokit.rest.issues.listForRepo({
            owner,
            repo,
            state: 'open',
            per_page: 10
          });
          issues = res.data;
        } else {
          // Get issues from all repos
          const reposRes = await octokit.rest.repos.listForAuthenticatedUser({ 
            per_page: 50 
          });
          
          const repos = reposRes.data;
          const issuePromises = repos.map(async (repo: any) => {
            try {
              const res = await octokit.rest.issues.listForRepo({
                owner: repo.owner.login,
                repo: repo.name,
                state: 'open',
                per_page: 5
              });
              return res.data.map((i: any) => ({ ...i, repo_name: repo.full_name }));
            } catch (e) {
              return [];
            }
          });
          
          const allIssues = await Promise.all(issuePromises);
          issues = allIssues.flat().slice(0, 10);
        }
        
        if (issues.length === 0) {
          return {
            content: repoFilter 
              ? `🐛 No open issues found in **${repoFilter}**.`
              : '🐛 No open issues found across your repositories.',
          };
        }
        
        const issueList = issues.map((i: any) => {
          const repo = i.repo_name || i.repository?.full_name || `${i.repository_url?.split('/').slice(-2).join('/')}`;
          const labels = i.labels?.map((l: any) => l.name).join(', ') || '';
          return `• **${repo}#${i.number}** ${i.title}${labels ? ` [${labels}]` : ''}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '🐛 GitHub Issues',
          description: issueList,
          color: EmbedColors.WARNING,
          footer: {
            text: `Showing ${issues.length} open issues${repoFilter ? ` in ${repoFilter}` : ''}`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        console.error('[Issues] Error:', err);
        if (err.status === 401) {
          return {
            content: '🔒 GitHub token is invalid or expired. Please re-link your account on the website.',
          };
        }
        return {
          content: `❌ Failed to fetch issues: ${err.message || 'Unknown error'}`,
        };
      }
    }
  },

  // 9. Commits - List recent commits
  commits: {
    name: 'commits',
    description: 'List recent GitHub commits across your repositories',
    options: [
      {
        name: 'repo',
        description: 'Filter by specific repository (owner/repo format)',
        type: 3, // STRING
        required: false
      }
    ],
    execute: async (interaction: DiscordInteraction) => {
      const access = await checkGitHubAccess(interaction);
      if (!access.ok) {
        return { content: access.message };
      }

      const octokit = await getUserOctokit(interaction);

      if (!octokit) {
        return {
          content: '❌ GitHub authentication failed.',
        };
      }

      const args = parseOptions(interaction);
      const repoFilter = args.repo as string;

      try {
        let commits: any[] = [];

        if (repoFilter) {
          // Get commits from specific repo
          const [owner, repo] = repoFilter.split('/');
          if (!owner || !repo) {
            return {
              content: '❌ Invalid repository format. Use: `owner/repo`',
            };
          }

          const res = await octokit.rest.repos.listCommits({
            owner,
            repo,
            per_page: 10
          });
          commits = res.data.map((c: any) => ({ ...c, repo_name: repoFilter }));
        } else {
          // Get commits from all repos
          const reposRes = await octokit.rest.repos.listForAuthenticatedUser({
            per_page: 10,
            sort: 'updated'
          });

          const repos = reposRes.data;
          const commitPromises = repos.map(async (repo: any) => {
            try {
              const res = await octokit.rest.repos.listCommits({
                owner: repo.owner.login,
                repo: repo.name,
                per_page: 5
              });
              return res.data.map((c: any) => ({
                ...c,
                repo_name: repo.name,
                repo_owner: repo.owner.login
              }));
            } catch (e) {
              return [];
            }
          });

          const allCommits = await Promise.all(commitPromises);
          commits = allCommits
            .flat()
            .sort((a: any, b: any) => new Date(b.commit.author?.date || 0).getTime() - new Date(a.commit.author?.date || 0).getTime())
            .slice(0, 10);
        }

        if (commits.length === 0) {
          return {
            content: repoFilter
              ? `📝 No commits found in **${repoFilter}**.`
              : '📝 No commits found across your repositories.',
          };
        }

        const commitList = commits.map((c: any) => {
          const message = c.commit.message?.split('\n')[0]?.substring(0, 50) || 'No message';
          const sha = c.sha?.substring(0, 7) || 'unknown';
          const repo = c.repo_name || 'unknown';
          return `• **\`${sha}\`** [${repo}] ${message}${c.commit.message?.length > 50 ? '...' : ''}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '📝 Recent Commits',
          description: commitList,
          color: EmbedColors.INFO,
          footer: {
            text: `Showing ${commits.length} commits${repoFilter ? ` in ${repoFilter}` : ''}`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        console.error('[Commits] Error:', err);
        if (err.status === 401) {
          return {
            content: '🔒 GitHub token is invalid or expired. Please re-link your account on the website.',
          };
        }
        return {
          content: `❌ Failed to fetch commits: ${err.message || 'Unknown error'}`,
        };
      }
    }
  },
};

// Helper to get command definitions for Discord registration
export function getCommandDefinitions() {
  return Object.values(commands).map(cmd => ({
    name: cmd.name,
    description: cmd.description,
    options: cmd.options || []
  }));
}
