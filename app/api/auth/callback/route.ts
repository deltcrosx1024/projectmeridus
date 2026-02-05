import { NextResponse } from 'next/server';

/**
 * GET /api/auth/callback
 * Exchanges GitHub OAuth `code` for an access token and stores it in an httpOnly cookie.
 * Requires `GITHUB_ID` and `GITHUB_SECRET` env variables.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  const client_id = process.env.GITHUB_ID;
  const client_secret = process.env.GITHUB_SECRET;

  if (!client_id || !client_secret) {
    return NextResponse.json({ error: 'OAuth client not configured on server' }, { status: 500 });
  }

  try {
    const tokenResp = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ client_id, client_secret, code }),
    });

    const tokenJson = await tokenResp.json();

    if (tokenJson.error) {
      return NextResponse.json({ error: tokenJson.error_description || tokenJson.error }, { status: 400 });
    }

    const accessToken = tokenJson.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access_token returned from GitHub' }, { status: 500 });
    }

    const redirectUrl = new URL('/', request.url);
    const res = NextResponse.redirect(redirectUrl);

    // Set httpOnly cookie with the token (server-side usage). Adjust maxAge as needed.
    res.cookies.set('github_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
