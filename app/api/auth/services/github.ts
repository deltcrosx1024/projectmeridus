import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';
import { linkUser } from '@/app/lib/userLinks';

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
  // Use service=github to match the frontend redirect URI
  const redirectUri = process.env.GITHUB_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback?service=github`;

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

  // Check if user already has Discord linked - if so, link them together
  const cookieStore = await cookies();
  const discordUserCookie = cookieStore.get('discord_user')?.value;
  
  if (discordUserCookie && accessToken) {
    try {
      const discordUser = JSON.parse(discordUserCookie);
      
      await linkUser(discordUser.id, accessToken, {
        discordUsername: discordUser.username,
        githubUsername: user.data.login,
      });
      
      console.log(`[GitHub OAuth] Linked Discord ${discordUser.id} to GitHub ${user.data.login}`);
      
      // Set a cookie to indicate successful linking
      res.cookies.set('accounts_linked', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 5, // 5 minutes - just for notification
      });
    } catch (err) {
      console.error('[GitHub OAuth] Failed to link accounts:', err);
    }
  }

  return res;
}
