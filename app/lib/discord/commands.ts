// lib/discord/commands.ts
import { DiscordCommand } from "@/app/types/discord";

export const commands: Record<string, DiscordCommand> = {
  ping: {
    name: 'ping',
    description: 'Responds with Pong!',
    execute: async () => ({ content: '🏓 Pong!' })
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
  // Add new commands here without touching the main route!
};