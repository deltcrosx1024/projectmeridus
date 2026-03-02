import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * GET /api/github/repos
 * Returns repositories for the authenticated user.
 * Accepts Authorization: Bearer <token> header or falls back to process.env.GITHUB_TOKEN
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
    const res = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 100 });
    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
