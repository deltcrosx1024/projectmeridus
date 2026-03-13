import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { linkVercelAccount } from '@/app/lib/userLinks';

const VERCEL_TOKEN_URL = 'https://api.vercel.com/login/oauth/token';

interface VercelTokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Handle Vercel OAuth callback (Sign in with Vercel - PKCE flow)
 */
export async function handleVercel(code: string, request: Request) {
  console.log('[Vercel OAuth] Starting callback...');
  
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  const redirectUri = process.env.VERCEL_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback?service=vercel`;

  if (!clientId || !clientSecret) {
    throw new Error('Vercel OAuth not configured');
  }

  const cookieStore = await cookies();
  const codeVerifierEncoded = cookieStore.get('vercel_code_verifier')?.value;
  
  if (!codeVerifierEncoded) {
    throw new Error('Missing code verifier. Please try logging in again.');
  }
  
  const codeVerifier = decodeURIComponent(codeVerifierEncoded);
  console.log('[Vercel OAuth] Code verifier length:', codeVerifier.length);

  console.log('[Vercel OAuth] Exchanging code for token...');
  
  const tokenResp = await fetch(VERCEL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }).toString(),
  });

  const rawText = await tokenResp.text();
  console.log('[Vercel OAuth] Token response status:', tokenResp.status);
  
  let tokenJson: VercelTokenResponse;
  try {
    tokenJson = JSON.parse(rawText);
  } catch {
    throw new Error(`Failed to parse Vercel response: ${rawText}`);
  }
  
  if (tokenJson.error) {
    console.error('[Vercel Token Error]', tokenJson);
    throw new Error(tokenJson.error_description || tokenJson.error);
  }

  const accessToken = tokenJson.access_token;
  const idToken = tokenJson.id_token;
  const refreshToken = tokenJson.refresh_token;
  
  if (!accessToken) {
    throw new Error('No access token returned from Vercel');
  }

  // Decode ID token to get user info
  let vercelUsername = '';
  let vercelEmail = '';
  let vercelUserId = '';
  
  if (idToken) {
    const decoded = decodeJwt(idToken);
    if (decoded) {
      console.log('[Vercel OAuth] Decoded ID token:', decoded);
      vercelUsername = decoded.preferred_username || decoded.name || decoded.sub || '';
      vercelEmail = decoded.email || '';
      vercelUserId = decoded.sub || '';
    }
  }

  console.log('[Vercel OAuth] User from ID token:', { vercelUsername, vercelEmail, vercelUserId });

  // Also try to get team info from access token by decoding it
  let vercelTeamId = '';
  let vercelTeamSlug = '';
  
  // First try to decode the access token to see if it has team info
  const decodedAccessToken = decodeJwt(accessToken);
  if (decodedAccessToken) {
    console.log('[Vercel OAuth] Decoded access token:', decodedAccessToken);
    vercelTeamId = decodedAccessToken.team_id || decodedAccessToken.tid || '';
    vercelTeamSlug = decodedAccessToken.team_slug || '';
  }
  
  // If no team from token, fetch from teams API
  if (!vercelTeamId) {
    try {
      const teamsRes = await fetch('https://api.vercel.com/v6/teams', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        console.log('[Vercel OAuth] Teams API response:', teamsData);
        if (teamsData.teams && teamsData.teams.length > 0) {
          vercelTeamId = teamsData.teams[0].id;
          vercelTeamSlug = teamsData.teams[0].slug;
          console.log('[Vercel OAuth] Found team:', { vercelTeamId, vercelTeamSlug });
        } else {
          console.log('[Vercel OAuth] No teams found for user');
        }
      } else {
        console.error('[Vercel OAuth] Failed to fetch teams:', await teamsRes.text());
      }
    } catch (err) {
      console.error('[Vercel OAuth] Error fetching teams:', err);
    }
  }

  const res = NextResponse.redirect(new URL('/', request.url));

  // Store tokens
  res.cookies.set('vercel_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  if (refreshToken) {
    res.cookies.set('vercel_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  res.cookies.set('vercel_user', JSON.stringify({
    username: vercelUsername,
    email: vercelEmail,
    userId: vercelUserId,
    teamId: vercelTeamId,
    teamSlug: vercelTeamSlug,
  }), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });

  // Try to link with Discord if available
  const discordUserCookie = cookieStore.get('discord_user')?.value;
  
  if (discordUserCookie) {
    try {
      const discordUser = JSON.parse(discordUserCookie);
      
      await linkVercelAccount(discordUser.id, accessToken, {
        vercelUsername,
        vercelTeamId,
      });
      
      console.log(`[Vercel OAuth] Linked Vercel to Discord ${discordUser.id}`);
      res.cookies.set('vercel_linked', 'true', { httpOnly: false, secure: true, sameSite: 'lax', path: '/', maxAge: 60 * 5 });
    } catch (err) {
      console.error('[Vercel OAuth] Failed to link accounts:', err);
    }
  } else {
    console.log('[Vercel OAuth] No Discord user found, storing Vercel only');
  }

  // Clear temporary cookies
  res.cookies.delete('vercel_code_verifier');
  res.cookies.delete('vercel_nonce');

  return res;
}
