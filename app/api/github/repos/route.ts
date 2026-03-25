import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * GET /api/github/repos
 * Returns repositories for the authenticated user.
 * Accepts Authorization: Bearer <token> header or falls back to process.env.GITHUB_TOKEN
 * 
 * Performance optimizations:
 * - Response caching with stale-while-revalidate
 * - Reduced page size for faster transfer
 * - Early return for unauthenticated requests
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('github_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.split(' ')[1];
  
  // Use user's token first, fall back to server token for Discord bot
  const token = cookieToken ?? headerToken ?? process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated. Please log in with GitHub.', needsAuth: true }, { status: 401 });
  }

  try {
    const octokit = new Octokit({ auth: token });
    const res = await octokit.rest.repos.listForAuthenticatedUser({ 
      per_page: 30, // Reduced from 100 - faster response
      sort: 'updated',
      direction: 'desc'
    });
    
    return NextResponse.json(res.data, {
      headers: {
        // Cache on CDN/browser: 5 min fresh, then allow stale for 1 hour
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        // Vary by auth to prevent caching different users' data
        'Vary': 'Cookie, Authorization',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
