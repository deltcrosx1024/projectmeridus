// lib/discord/permissions.ts
// Command permission system for Discord bot

import { DiscordInteraction } from '@/app/types/discord';

// Permission levels
export enum PermissionLevel {
  EVERYONE = 0,    // Any user
  MODERATOR = 1,   // Manage Messages permission
  ADMIN = 2,       // Administrator permission
  OWNER = 3,       // Server owner
}

// Command permission requirements
export const COMMAND_PERMISSIONS: Record<string, PermissionLevel> = {
  // Everyone commands
  ping: PermissionLevel.EVERYONE,
  status: PermissionLevel.EVERYONE,
  repos: PermissionLevel.EVERYONE,
  issues: PermissionLevel.EVERYONE,
  commits: PermissionLevel.EVERYONE,
  pr: PermissionLevel.EVERYONE,
  search: PermissionLevel.EVERYONE,
  mystats: PermissionLevel.EVERYONE,
  help: PermissionLevel.EVERYONE,
  settings: PermissionLevel.EVERYONE,
  
  // Moderator commands
  list: PermissionLevel.MODERATOR,
  test: PermissionLevel.MODERATOR,
  webhook: PermissionLevel.MODERATOR,
  
  // Admin commands
  subscribe: PermissionLevel.ADMIN,
  unsubscribe: PermissionLevel.ADMIN,
  export: PermissionLevel.ADMIN,
  import: PermissionLevel.ADMIN,
  
  // Owner-only commands (if any)
  // none currently
};

/**
 * Check if user has required permission for a command
 */
export function checkPermission(
  interaction: DiscordInteraction,
  commandName: string
): { allowed: boolean; level: PermissionLevel; required: PermissionLevel } {
  const requiredLevel = COMMAND_PERMISSIONS[commandName] || PermissionLevel.EVERYONE;
  
  // Get user's permission level
  const userLevel = getUserPermissionLevel(interaction);
  const allowed = userLevel >= requiredLevel;
  
  console.log(`[Discord] Permission check for ${commandName}: required=${formatPermissionLevel(requiredLevel)}, user=${formatPermissionLevel(userLevel)}, allowed=${allowed}`);
  
  return {
    allowed,
    level: userLevel,
    required: requiredLevel,
  };
}

/**
 * Get user's permission level in the guild
 */
function getUserPermissionLevel(interaction: DiscordInteraction): PermissionLevel {
  const member = interaction.member;
  
  // Check if guild owner (when member data is missing)
  if (!member && interaction.guild_id && interaction.user?.id) {
    // If we're in a guild and have user data but no member data,
    // check if the user is the guild owner
    if (interaction.guild_id === interaction.user.id) {
      console.log('[Discord] User identified as guild owner (no member data)');
      return PermissionLevel.OWNER;
    }
    console.log('[Discord] No member data in interaction, assuming not owner');
    return PermissionLevel.EVERYONE;
  }
  
  if (!member) {
    console.log('[Discord] No member or guild data in interaction');
    return PermissionLevel.EVERYONE;
  }
  
  // Check if guild owner
  if (interaction.guild_id && member.user?.id) {
    if (interaction.guild_id === member.user.id) {
      console.log('[Discord] User identified as guild owner');
      return PermissionLevel.OWNER;
    }
  }
  
  const permissions = parseInt(member.permissions || '0', 10);
  console.log(`[Discord] Permission check: raw permissions = ${permissions}, userId = ${member.user?.id}`);
  
  // Check Administrator (0x8)
  if (permissions & 0x8) {
    console.log('[Discord] User has Administrator permission');
    return PermissionLevel.ADMIN;
  }
  
  // Check Manage Messages (0x2000) or Manage Channels (0x10)
  if (permissions & 0x2000 || permissions & 0x10) {
    console.log('[Discord] User has Moderator permission');
    return PermissionLevel.MODERATOR;
  }
  
  console.log('[Discord] User has Everyone permission (no admin/mod perms found)');
  return PermissionLevel.EVERYONE;
}

/**
 * Format permission level name
 */
export function formatPermissionLevel(level: PermissionLevel): string {
  switch (level) {
    case PermissionLevel.EVERYONE:
      return 'Everyone';
    case PermissionLevel.MODERATOR:
      return 'Moderator';
    case PermissionLevel.ADMIN:
      return 'Administrator';
    case PermissionLevel.OWNER:
      return 'Server Owner';
    default:
      return 'Unknown';
  }
}

/**
 * Get permission error message
 */
export function getPermissionErrorMessage(
  commandName: string,
  required: PermissionLevel,
  current: PermissionLevel
): string {
  return `
❌ **Permission Denied**

You need **${formatPermissionLevel(required)}** permission to use \`/${commandName}\`.
Your current level: **${formatPermissionLevel(current)}**

**How to fix:**
${required === PermissionLevel.ADMIN 
  ? '• Ask a server administrator to run this command\n• Or ask to be given Administrator permission'
  : required === PermissionLevel.MODERATOR
    ? '• Ask a moderator or admin to run this command\n• Or ask for Manage Messages permission'
    : '• This command should be available to everyone. Contact support if you see this.'}
`;
}
