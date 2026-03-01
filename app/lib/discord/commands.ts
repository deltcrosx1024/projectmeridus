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

// Environment configuration
const MERIDUS_URL = process.env.MERIDUS_BOT_URL || 'https://www.meridusdev.in.th';
const MERIDUS_API_KEY = process.env.MERIDUS_API_KEY || '';
const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

// API helper functions
async function callMeridusAPI(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
  const url = `${MERIDUS_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (MERIDUS_API_KEY) {
    headers['x-api-key'] = MERIDUS_API_KEY;
  }
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `API Error: ${response.status}`);
  }
  
  return data;
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
      // Calculate uptime (server start time approximation)
      const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : 0;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      const seconds = uptimeSeconds % 60;
      
      const uptimeStr = days > 0 
        ? `${days}d ${hours}h ${minutes}m ${seconds}s`
        : `${hours}h ${minutes}m ${seconds}s`;
      
      // Get subscription count from API
      let subscriptionCount = 0;
      try {
        const subs = await callMeridusAPI('/api/meridus/subscriptions');
        subscriptionCount = subs.subscriptions?.length || subs.length || 0;
      } catch (e) {
        // Ignore error, show 0
      }
      
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
          {
            name: '🌐 API URL',
            value: MERIDUS_URL,
            inline: false
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
        description: 'Events to subscribe to (default: all)',
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
        await callMeridusAPI('/api/meridus/subscriptions/add', 'POST', {
          channelId,
          repo,
          events
        });
        
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
        await callMeridusAPI('/api/meridus/subscriptions/remove', 'POST', {
          channelId,
          repo
        });
        
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
        const data = await callMeridusAPI('/api/meridus/subscriptions');
        const subscriptions = data.subscriptions || data || [];
        
        if (subscriptions.length === 0) {
          return {
            content: '📭 No active subscriptions found.',
          };
        }
        
        // Filter by channel if specified
        const filtered = channelFilter 
          ? subscriptions.filter((sub: any) => sub.channelId === channelFilter)
          : subscriptions;
        
        if (filtered.length === 0) {
          return {
            content: `📭 No subscriptions found for <#${channelFilter}>.`,
          };
        }
        
        // Group by channel
        const byChannel: Record<string, any[]> = {};
        for (const sub of filtered) {
          if (!byChannel[sub.channelId]) {
            byChannel[sub.channelId] = [];
          }
          byChannel[sub.channelId].push(sub);
        }
        
        const lines = Object.entries(byChannel).map(([channelId, subs]) => {
          const repoList = subs.map((s: any) => `  • ${s.repo} (${s.events?.join(', ') || 'all'})`).join('\n');
          return `<#${channelId}>:\n${repoList}`;
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
    execute: async () => {
      try {
        // Call the GitHub repos API through the website
        const repos = await callMeridusAPI('/api/github/repos');
        
        if (!Array.isArray(repos) || repos.length === 0) {
          return {
            content: '📂 No repositories found or authentication required.',
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
          title: '📂 Your GitHub Repositories',
          description: repoList,
          color: EmbedColors.GITHUB,
          footer: {
            text: `Showing ${topRepos.length} of ${repos.length} repositories`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
        if (err.message?.includes('401') || err.message?.includes('authentication')) {
          return {
            content: '🔒 Authentication required. Please log in to GitHub through the website.',
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
      const args = parseOptions(interaction);
      const repoFilter = args.repo as string;
      
      try {
        let endpoint = '/api/github/issues';
        if (repoFilter) {
          endpoint += `?repo=${encodeURIComponent(repoFilter)}`;
        }
        
        const issues = await callMeridusAPI(endpoint);
        
        if (!Array.isArray(issues) || issues.length === 0) {
          return {
            content: repoFilter 
              ? `🐛 No open issues found in **${repoFilter}**.`
              : '🐛 No open issues found across your repositories.',
          };
        }
        
        const topIssues = issues.slice(0, 10);
        const issueList = topIssues.map((i: any) => {
          const repo = i.repository?.full_name || i.repository_url?.split('/').slice(-2).join('/') || 'unknown';
          const labels = i.labels?.map((l: any) => l.name).join(', ') || '';
          return `• **${repo}#${i.number}** ${i.title}${labels ? ` [${labels}]` : ''}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '🐛 GitHub Issues',
          description: issueList,
          color: EmbedColors.WARNING,
          footer: {
            text: `Showing ${topIssues.length} of ${issues.length} issues${repoFilter ? ` in ${repoFilter}` : ''}`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
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
      const args = parseOptions(interaction);
      const repoFilter = args.repo as string;
      
      try {
        let endpoint = '/api/github/commits';
        if (repoFilter) {
          endpoint += `?repo=${encodeURIComponent(repoFilter)}`;
        }
        
        const commits = await callMeridusAPI(endpoint);
        
        if (!Array.isArray(commits) || commits.length === 0) {
          return {
            content: repoFilter 
              ? `📝 No commits found in **${repoFilter}**.`
              : '📝 No commits found across your repositories.',
          };
        }
        
        const topCommits = commits.slice(0, 10);
        const commitList = topCommits.map((c: any) => {
          const message = c.message?.split('\n')[0]?.substring(0, 50) || 'No message';
          const sha = c.sha?.substring(0, 7) || 'unknown';
          const repo = c.repo_name || 'unknown';
          return `• **\`${sha}\`** [${repo}] ${message}${c.message?.length > 50 ? '...' : ''}`;
        }).join('\n');
        
        const embed: DiscordEmbed = {
          title: '📝 Recent Commits',
          description: commitList,
          color: EmbedColors.INFO,
          footer: {
            text: `Showing ${topCommits.length} of ${commits.length} commits${repoFilter ? ` in ${repoFilter}` : ''}`
          }
        };
        
        return { embeds: [embed] };
      } catch (err: any) {
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
