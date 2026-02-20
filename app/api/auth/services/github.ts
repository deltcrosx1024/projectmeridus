import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';

/**
 * Handle GitHub OAuth callback
 * Exchanges code for access token and validates it
 */
export async function handleGitHub(code: string, request: Request) {
  const clientId = process.env.GITHUB_ID;
  const clientSecret = process.env.GITHUB_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth not configured');
  }

  // Use dynamic redirect URI based on request origin (must match GitHub OAuth App callback URL)
  // Uses ?services=github to match the frontend redirect URI
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback?services=github`;

  const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });

  const tokenJson = await tokenResp.json();
  if (tokenJson.error) {
    console.error('[GitHub OAuth Error]', {
      error: tokenJson.error,
      error_description: tokenJson.error_description,
      client_id_used: clientId?.substring(0, 8) + '...',
      redirect_uri_used: redirectUri,
    });
    throw new Error(tokenJson.error_description || tokenJson.error);
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    throw new Error('No access token returned from GitHub');
  }

  // Validate token by fetching authenticated user
  const octokit = new Octokit({ auth: accessToken });
  const user = await octokit.rest.users.getAuthenticated();

  const res = NextResponse.redirect(new URL('/', request.url));
  res.cookies.set('github_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Store full user info (non-httpOnly so client can read it)
  const userData = {
    id: user.data.id,
    login: user.data.login,
    avatar_url: user.data.avatar_url,
    name: user.data.name,
    bio: user.data.bio,
    public_repos: user.data.public_repos,
    followers: user.data.followers,
  };
  
  res.cookies.set('github_user', JSON.stringify(userData), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
