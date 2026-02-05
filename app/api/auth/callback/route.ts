import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { handleGitHub } from '@/app/api/auth/services/github';
import { handleDiscord } from '@/app/api/auth/services/discord';

/**
 * Universal OAuth Callback Handler
 * GET /api/auth/callback?service=github&code=...&state=...
 * GET /api/auth/callback?service=discord&code=...&state=...
 *
 * Supports: GitHub OAuth, Discord OAuth, CSRF protection via state
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  
  const cookieStore = await cookies();
  const service = cookieStore.get('oauth_service')?.value;

  if (!service || !code) {
    return NextResponse.json(
      { error: 'Missing service or code parameter' },
      { status: 400 }
    );
  }

  if (state) {
    const sessionState = cookieStore.get('oauth_state')?.value;
    if (state !== sessionState) {
      return NextResponse.json({ error: 'Invalid state - CSRF check failed' }, { status: 403 });
    }
  }

  try {
    let response;
    switch (service) {
      case 'github':
        response = await handleGitHub(code, request);
        break;
      case 'discord':
        response = await handleDiscord(code, request);
        break;
      default:
        return NextResponse.json({ error: `Unknown service: ${service}` }, { status: 400 });
    }
    response.cookies.delete('oauth_state');
    response.cookies.delete('oauth_service');
    return response;
  } catch (err: any) {
    console.error(`[OAuth Error] Service: ${service}`, err);
    return NextResponse.json({ error: err?.message ?? 'Auth failed' }, { status: 500 });
  }
}
