/**
 * OAuth Login Helpers
 * Generate authorization URLs and state tokens for OAuth providers
 */

/**
 * Generate a cryptographically secure random state token for CSRF protection
 * Uses window.crypto for client-side compatibility
 */
export function generateState(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
 * Get Discord OAuth authorization URL (User Login + Bot Install)
 */
export function getDiscordAuthUrl(clientId: string, redirectUri: string, state?: string, permissions: string = '8'): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'identify email guilds bot applications.commands',
    response_type: 'code',
    permissions,
    ...(state && { state }),
  });
  return `https://discord.com/oauth2/authorize?${params}`;
}

/**
 * Client-side hook example for GitHub login
 * Usage: onClick={() => handleGitHubLogin()}
 */
export function handleGitHubLogin(clientId: string): void {
  const redirectUri = window.location.origin + '/api/auth/callback?service=github';
  const state = generateState();
  
  // Store state and service type in cookies for CSRF validation
  document.cookie = `oauth_state=${state}; path=/; max-age=600`; // 10 minutes
  document.cookie = `oauth_service=github; path=/; max-age=600`;
  
  window.location.href = getGitHubAuthUrl(clientId, redirectUri, state);
}

/**
 * Client-side hook example for Discord login + Bot install
 * Usage: onClick={() => handleDiscordLogin()}
 */
export function handleDiscordLogin(clientId: string, permissions: string = '8'): void {
  // Use dynamic origin with service parameter - must match Discord Developer Portal redirect URI
  const redirectUri = window.location.origin + '/api/auth/callback?service=discord';
  const state = generateState();
  
  // Store state and service type in cookies for CSRF validation
  document.cookie = `oauth_state=${state}; path=/; max-age=600`; // 10 minutes
  document.cookie = `oauth_service=discord; path=/; max-age=600`;
  
  window.location.href = getDiscordAuthUrl(clientId, redirectUri, state, permissions);
}

/**
 * Get Vercel OAuth authorization URL
 */
export function getVercelAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'read write',
    ...(state && { state }),
  });
  return `https://vercel.com/oauth/authorize?${params}`;
}

/**
 * Client-side hook for Vercel login
 * Uses Sign in with Vercel (new PKCE flow)
 */
export function handleVercelLogin(clientId: string): void {
  const redirectUri = window.location.origin + '/api/auth/callback?service=vercel';
  const state = generateState();
  
  // Generate code verifier (URL-safe characters only, 43-128 chars)
  const codeVerifier = generateState() + generateState() + generateState();
  // Base64URL encode for code challenge
  const codeChallenge = btoa(codeVerifier)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  console.log('[Vercel] Code verifier length:', codeVerifier.length);
  console.log('[Vercel] Code challenge length:', codeChallenge.length);
  
  // Store state and code verifier in cookies (encodeURIComponent to handle special chars)
  document.cookie = `oauth_state=${encodeURIComponent(state)}; path=/; max-age=600; SameSite=Lax`;
  document.cookie = `oauth_service=vercel; path=/; max-age=600; SameSite=Lax`;
  document.cookie = `vercel_code_verifier=${encodeURIComponent(codeVerifier)}; path=/; max-age=600; SameSite=Lax`;
  
  // Build authorization URL with PKCE
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  
  window.location.href = `https://vercel.com/oauth/authorize?${params}`;
}