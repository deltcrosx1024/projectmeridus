import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { linkVercelAccount } from '@/app/lib/userLinks';

const VERCEL_API_URL = 'https://api.vercel.com';

interface VercelTokenResponse {
  access_token?: string;
  token_type?: string;
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
  teams: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

/**
 * Handle Vercel OAuth callback
 * Exchanges code for access token and links to existing Discord account
 */
export async function handleVercel(code: string, request: Request) {
  const clientId = process.env.VERCEL_CLIENT_ID;
  const clientSecret = process.env.VERCEL_CLIENT_SECRET;
  const redirectUri = process.env.VERCEL_REDIRECT_URI || `${new URL(request.url).origin}/api/auth/callback?service=vercel`;

  if (!clientId || !clientSecret) {
    throw new Error('Vercel OAuth not configured');
  }

  const tokenResp = await fetch('https://api.vercel.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  const tokenJson: VercelTokenResponse = await tokenResp.json();
  
  if (tokenJson.error) {
    console.error('[Vercel Token Error]', tokenJson);
    throw new Error(tokenJson.error_description || tokenJson.error);
  }

  const accessToken = tokenJson.access_token;
  if (!accessToken) {
    throw new Error('No access token returned from Vercel');
  }

  const userResp = await fetch(`${VERCEL_API_URL}/www/user`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResp.ok) {
    const errData = await userResp.json();
    console.error('[Vercel User Fetch Error]', errData);
    throw new Error(`Failed to fetch Vercel user info: ${userResp.statusText}`);
  }

  const vercelUser: VercelUser = await userResp.json();

  const res = NextResponse.redirect(new URL('/', request.url));

  const cookieStore = await cookies();
  const discordUserCookie = cookieStore.get('discord_user')?.value;
  
  if (discordUserCookie) {
    try {
      const discordUser = JSON.parse(discordUserCookie);
      
      await linkVercelAccount(discordUser.id, accessToken, {
        vercelUsername: vercelUser.user.username,
        vercelTeamId: vercelUser.teams?.[0]?.id,
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

  return res;
}
