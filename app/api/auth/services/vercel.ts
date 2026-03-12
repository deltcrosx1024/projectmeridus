import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { linkVercelAccount } from '@/app/lib/userLinks';

const VERCEL_TOKEN_URL = 'https://api.vercel.com/login/oauth/token';
const VERCEL_USER_URL = 'https://api.vercel.com/v2/user';

interface VercelTokenResponse {
  access_token?: string;
  id_token?: string;
  token_type?: string;
  expires_in?: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
}

interface VercelUser {
  user: {
    id: string;
    email: string;
    name: string;
    username: string;
  };
}

/**
 * Handle Vercel OAuth callback (Sign in with Vercel - PKCE flow)
 */
export async function handleVercel(code: string, request: Request) {
  console.log('[Vercel OAuth] Starting callback with PKCE flow...');
  
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  const redirectUri = process.env.VERCEL_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback?service=vercel`;

  if (!clientId || !clientSecret) {
    throw new Error('Vercel OAuth not configured. Add VERCEL_CLIENT_ID and VERCEL_CLIENT_SECRET to .env');
  }

  // Get code verifier from cookie
  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('vercel_code_verifier')?.value;
  
  if (!codeVerifier) {
    throw new Error('Missing code verifier. Please try logging in again.');
  }

  console.log('[Vercel OAuth] Exchanging code for token...');

  // Exchange code for token using PKCE
  const tokenResp = await fetch(VERCEL_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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
  console.log('[Vercel OAuth] Token response:', rawText.substring(0, 500));
  
  let tokenJson: VercelTokenResponse;
  try {
    tokenJson = JSON.parse(rawText);
  } catch {
    throw new Error(`Failed to parse Vercel response: ${rawText}`);
  }
  
  if (tokenJson.error) {
    console.error('[Vercel Token Error]', tokenJson);
    const errorMsg = tokenJson.error_description || tokenJson.error;
    throw new Error(`Vercel OAuth failed: ${errorMsg}`);
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    throw new Error('No access token returned from Vercel');
  }

  console.log('[Vercel OAuth] Fetching user info...');

  // Get user info using the access token
  const userResp = await fetch(VERCEL_USER_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResp.ok) {
    const errData = await userResp.text();
    console.error('[Vercel User Fetch Error]', errData);
    throw new Error(`Failed to fetch Vercel user info: ${userResp.statusText}`);
  }

  const vercelUser: VercelUser = await userResp.json();
  console.log('[Vercel OAuth] User fetched:', vercelUser.user.username);

  const res = NextResponse.redirect(new URL('/', request.url));

  const discordUserCookie = cookieStore.get('discord_user')?.value;
  
  if (discordUserCookie) {
    try {
      const discordUser = JSON.parse(discordUserCookie);
      
      await linkVercelAccount(discordUser.id, accessToken, {
        vercelUsername: vercelUser.user.username,
      });
      
      console.log(`[Vercel OAuth] Linked Vercel to Discord ${discordUser.id}`);
      
      res.cookies.set('vercel_linked', 'true', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 5,
      });
    } catch (err) {
      console.error('[Vercel OAuth] Failed to link accounts:', err);
    }
  } else {
    console.log('[Vercel OAuth] No Discord user found, storing token temporarily');
    res.cookies.set('vercel_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5,
    });
    
    res.cookies.set('vercel_user', JSON.stringify({
      username: vercelUser.user.username,
      email: vercelUser.user.email,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 5,
    });
  }

  // Clear temporary cookies
  res.cookies.delete('vercel_code_verifier');
  res.cookies.delete('vercel_nonce');

  return res;
}
