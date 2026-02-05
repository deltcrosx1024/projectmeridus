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

  const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const tokenJson = await tokenResp.json();
  if (tokenJson.error) {
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

  // Optional: store user info
  res.cookies.set('github_user', JSON.stringify({ id: user.data.id, login: user.data.login }), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  return res;
}
