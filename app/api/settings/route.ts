import { NextRequest, NextResponse } from 'next/server';
import { getUserSettings, saveUserSettings } from '@/app/lib/settings';

// GET /api/settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    // Get user from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse cookies properly - consistent with POST method
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...value] = c.split('=');
        return [key, value.join('=')];
      })
    );

    // Try to get user ID from either GitHub or Discord
    let userId: string | null = null;
    
    const githubUserCookie = cookies.github_user;
    if (githubUserCookie) {
      try {
        const ghUser = JSON.parse(decodeURIComponent(githubUserCookie));
        userId = `github:${ghUser.id}`;
      } catch (e) {
        console.error('[Settings] Failed to parse github_user cookie:', e);
      }
    }
    
    const discordUserCookie = cookies.discord_user;
    if (!userId && discordUserCookie) {
      try {
        const discordUser = JSON.parse(decodeURIComponent(discordUserCookie));
        userId = `discord:${discordUser.id}`;
      } catch (e) {
        console.error('[Settings] Failed to parse discord_user cookie:', e);
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getUserSettings(userId);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[Settings API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to get settings', details: String(error) },
      { status: 500 }
    );
  }
}

// POST /api/settings - Update user settings
export async function POST(request: NextRequest) {
  try {
    // Get user from cookies
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse cookies
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...value] = c.split('=');
        return [key, value.join('=')];
      })
    );

    // Try to get user ID from either GitHub or Discord
    let userId: string | null = null;
    
    if (cookies.github_user) {
      try {
        const ghUser = JSON.parse(decodeURIComponent(cookies.github_user));
        userId = `github:${ghUser.id}`;
      } catch {
        // Invalid cookie
      }
    }
    
    if (!userId && cookies.discord_user) {
      try {
        const discordUser = JSON.parse(decodeURIComponent(cookies.discord_user));
        userId = `discord:${discordUser.id}`;
      } catch {
        // Invalid cookie
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const settings = await saveUserSettings(userId, body);
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('[Settings API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
