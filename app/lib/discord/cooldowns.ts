// lib/discord/cooldowns.ts
// Command cooldown system to prevent spam

interface CooldownEntry {
  userId: string;
  command: string;
  timestamp: number;
}

// In-memory cooldown storage (cleared on server restart)
const cooldowns = new Map<string, number>();

// Default cooldowns in seconds
export const DEFAULT_COOLDOWNS: Record<string, number> = {
  repos: 30,
  issues: 15,
  commits: 15,
  pr: 20,
  search: 10,
  status: 5,
  ping: 5,
  test: 60,
  subscribe: 10,
  unsubscribe: 10,
  list: 5,
  default: 5,
};

/**
 * Check if user is on cooldown for a command
 * Returns remaining seconds if on cooldown, 0 if not
 */
export function checkCooldown(userId: string, command: string): number {
  const key = `${userId}:${command}`;
  const cooldownSeconds = DEFAULT_COOLDOWNS[command] || DEFAULT_COOLDOWNS.default;
  const lastUsed = cooldowns.get(key);
  
  if (!lastUsed) {
    return 0;
  }
  
  const now = Date.now();
  const elapsed = (now - lastUsed) / 1000;
  const remaining = Math.ceil(cooldownSeconds - elapsed);
  
  return remaining > 0 ? remaining : 0;
}

/**
 * Set cooldown for a user and command
 */
export function setCooldown(userId: string, command: string): void {
  const key = `${userId}:${command}`;
  cooldowns.set(key, Date.now());
}

/**
 * Clear all cooldowns (for admin use)
 */
export function clearCooldowns(): void {
  cooldowns.clear();
}

/**
 * Format cooldown message
 */
export function formatCooldownMessage(remaining: number): string {
  if (remaining < 60) {
    return `⏱️ Please wait ${remaining} second${remaining !== 1 ? 's' : ''} before using this command again.`;
  }
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return `⏱️ Please wait ${minutes}m ${seconds}s before using this command again.`;
}
