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
  const guildId = url.searchParams.get('guild_id');
  const permissions = url.searchParams.get('permissions');
  
  const cookieStore = await cookies();
  // Try to get service from cookie first, then fall back to URL parameter
  let service: string | null = cookieStore.get('oauth_service')?.value || null;
  if (!service) {
    // Also check for 'service' parameter (Discord uses this)
    service = url.searchParams.get('service') || url.searchParams.get('services') || null;
  }

  // Auto-detect Discord callback if no service specified
  // Discord callbacks have: code + permissions (and optionally guild_id)
  if (!service && code && permissions) {
    service = 'discord';
  }

  // Handle Discord bot invite callback (has guild_id from successful bot install)
  // Bot installs may have 'permissions' param but no 'code' or with 'code'
  if (guildId && !service) {
    // Bot was successfully added to a server
    // Store a cookie to indicate bot was invited
    const res = NextResponse.redirect(new URL('/?bot_invited=true', request.url));
    res.cookies.set('bot_invited_guild', guildId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });
    return res;
  }

  // Also handle case where bot install includes permissions param but no service
  if (guildId && permissions && !service) {
    const res = NextResponse.redirect(new URL('/?bot_invited=true', request.url));
    res.cookies.set('bot_invited_guild', guildId, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return res;
  }

  if (!service || !code) {
    return NextResponse.json(
      { error: 'Missing service or code parameter' },
      { status: 400 }
    );
  }

  // Skip state validation for Discord bot installs (they don't have state)
  // Bot installs are identified by having permissions + guild_id without state
  const isDiscordBotInstall = service === 'discord' && permissions && guildId && !state;
  
  // State parameter is required for CSRF protection (user login only)
  if (!state && !isDiscordBotInstall) {
    return NextResponse.json(
      { error: 'Missing state parameter - CSRF validation failed' },
      { status: 400 }
    );
  }

  // Only validate state for user OAuth flows (not bot installs)
  if (!isDiscordBotInstall) {
    const sessionState = cookieStore.get('oauth_state')?.value;
    if (!sessionState) {
      return NextResponse.json(
        { error: 'Missing session state - CSRF validation failed' },
        { status: 400 }
      );
    }

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
        // If bot was also added during Discord auth (hybrid flow), store guild info
        if (guildId) {
          response.cookies.set('bot_invited_guild', guildId, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24,
          });
        }
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
