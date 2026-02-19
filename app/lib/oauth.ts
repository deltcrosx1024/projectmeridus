/**
 * OAuth Login Helpers
 * Generate authorization URLs and state tokens for OAuth providers
 */

/**
 * Generate a random state token for CSRF protection
 */
export function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get GitHub OAuth authorization URL
 */
export function getGitHubAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'repo user read:user',
    ...(state && { state }),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * Get Discord OAuth authorization URL
 */
export function getDiscordAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'identify email guilds',
    response_type: 'code',
    ...(state && { state }),
  });
  return `https://discord.com/api/oauth2/authorize?${params}`;
}

/**
 * Client-side hook example for GitHub login
 * Usage: onClick={() => handleGitHubLogin()}
 */
export function handleGitHubLogin(clientId: string): void {
  const redirectUri = window.location.origin + '/api/auth/callback?services=github';
  const state = generateState();
  
  // Store state and service type in cookies for CSRF validation
  document.cookie = `oauth_state=${state}; path=/; max-age=600`; // 10 minutes
  document.cookie = `oauth_service=github; path=/; max-age=600`;
  
  window.location.href = getGitHubAuthUrl(clientId, redirectUri, state);
}

/**
 * Client-side hook example for Discord login
 * Usage: onClick={() => handleDiscordLogin()}
 */
export function handleDiscordLogin(clientId: string): void {
  // Use dynamic origin - will be extracted from request URL on callback
  const redirectUri = window.location.origin + '/api/auth/callback';
  const state = generateState();
  
  // Store state and service type in cookies for CSRF validation
  document.cookie = `oauth_state=${state}; path=/; max-age=600`; // 10 minutes
  document.cookie = `oauth_service=discord; path=/; max-age=600`;
  
  window.location.href = getDiscordAuthUrl(clientId, redirectUri, state);
}