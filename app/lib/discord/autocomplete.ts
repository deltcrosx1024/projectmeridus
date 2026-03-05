// lib/discord/autocomplete.ts
// Autocomplete handlers for Discord slash commands

import { Octokit } from 'octokit';
import { DiscordInteraction, DiscordInteractionOption } from '@/app/types/discord';
import { getUserLink } from '@/app/lib/userLinks';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';

interface AutocompleteChoice {
  name: string;
  value: string;
}

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

/**
 * Handle autocomplete for repository names
 */
export async function handleRepoAutocomplete(
  interaction: DiscordInteraction,
  focusedOption: DiscordInteractionOption
): Promise<AutocompleteChoice[]> {
  const query = (focusedOption.value as string)?.toLowerCase() || '';
  
  const octokit = await getUserOctokit(interaction);
  if (!octokit) return [];
  
  try {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
    });
    
    const filtered = repos
      .filter((repo: any) => 
        repo.full_name.toLowerCase().includes(query) ||
        repo.name.toLowerCase().includes(query)
      )
      .slice(0, 25) // Discord max choices
      .map((repo: any) => ({
        name: `${repo.full_name} ⭐ ${repo.stargazers_count}`,
        value: repo.full_name,
      }));
    
    return filtered;
  } catch (err) {
    console.error('[Autocomplete] Error fetching repos:', err);
    return [];
  }
}

/**
 * Handle autocomplete for event types
 */
export async function handleEventAutocomplete(
  focusedOption: DiscordInteractionOption
): Promise<AutocompleteChoice[]> {
  const query = (focusedOption.value as string)?.toLowerCase() || '';
  
  const events = [
    { name: 'push - Commits pushed', value: 'push' },
    { name: 'issues - Issues opened/closed', value: 'issues' },
    { name: 'pull_request - PRs opened/merged', value: 'pull_request' },
    { name: 'release - New releases', value: 'release' },
    { name: 'issue_comment - Comments on issues', value: 'issue_comment' },
    { name: 'workflow_run - GitHub Actions', value: 'workflow_run' },
    { name: 'discussion - Repository discussions', value: 'discussion' },
    { name: 'create - Branches/tags created', value: 'create' },
    { name: 'delete - Branches/tags deleted', value: 'delete' },
  ];
  
  return events.filter(e => 
    e.name.toLowerCase().includes(query) || 
    e.value.toLowerCase().includes(query)
  ).slice(0, 25);
}

/**
 * Handle autocomplete for channels (already handled by Discord, but can enhance)
 */
export function handleChannelAutocomplete(
  focusedOption: DiscordInteractionOption
): AutocompleteChoice[] {
  // Discord provides channel autocomplete natively
  // This is a placeholder for custom channel filtering if needed
  return [];
}

/**
 * Main autocomplete dispatcher
 */
export async function handleAutocomplete(interaction: DiscordInteraction): Promise<AutocompleteChoice[]> {
  const focusedOption = interaction.data?.options?.find(opt => opt.focused);
  
  if (!focusedOption) return [];
  
  switch (focusedOption.name) {
    case 'repo':
    case 'repository':
      return handleRepoAutocomplete(interaction, focusedOption);
    case 'events':
    case 'event':
      return handleEventAutocomplete(focusedOption);
    default:
      return [];
  }
}
