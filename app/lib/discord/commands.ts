// lib/discord/commands.ts
import { DiscordCommand } from "@/app/types/discord";

export const commands: Record<string, DiscordCommand> = {
  ping: {
    name: 'ping',
    description: 'Responds with Pong!',
    execute: async () => ({ content: '🏓 Pong!' })
  },
  hello: {
    name: 'hello',
    description: 'Says hello from Meridus!',
    execute: async () => ({ content: '👋 Hello from Meridus!' })
  },
  status: {
    name: 'status',
    description: 'Shows the bot and API status',
    execute: async () => {
      const botUrl = process.env.MERIDUS_BOT_URL || 'https://www.meridusdev.in.th';
      return { content: `📊 **Meridus Bot Status**\n\n🌐 API URL: ${botUrl}\n✅ Status: Online\n🔒 HTTPS: Enabled` };
    }
  },
  repos: {
    name: 'repos',
    description: 'Lists your GitHub repositories',
    execute: async () => {
      const { Octokit } = await import('octokit');
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return { content: '❌ GitHub token not configured on server.' };
      }
      const octokit = new Octokit({ auth: githubToken });
      const res = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 5 });
      const repos = res.data.map(r => `• ${r.full_name} (⭐ ${r.stargazers_count})`).join('\n');
      return { content: `📂 **Your GitHub Repositories:**\n${repos}` };
    }
  },
  issues: {
    name: 'issues',
    description: 'Lists your GitHub issues',
    execute: async () => {
      const { Octokit } = await import('octokit');
      const githubToken = process.env.GITHUB_TOKEN;
      if (!githubToken) {
        return { content: '❌ GitHub token not configured on server.' };
      }
      const octokit = new Octokit({ auth: githubToken });
      const searchRes = await octokit.rest.search.issuesAndPullRequests({
        q: 'is:issue author:@me',
        per_page: 5,
      });
      const issues = searchRes.data.items?.map(i => `• ${i.title} (#${i.number})`).join('\n') || 'No issues found';
      return { content: `🐛 **Your GitHub Issues:**\n${issues}` };
    }
  },
  repo: {
    name: 'repo',
    description: 'Get information about a GitHub repository',
    execute: async (interaction) => {
      const owner = interaction.data.options?.[0]?.value;
      const repo = interaction.data.options?.[1]?.value;
      return { content: `📦 **${owner}/${repo}**\nhttps://github.com/${owner}/${repo}` };
    }
  },
};