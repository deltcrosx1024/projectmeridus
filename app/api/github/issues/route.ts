import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * GET /api/github/issues?type=pull
 * Returns issues or pull requests for the authenticated user across repositories.
 * Accepts Authorization: Bearer <token> header or falls back to process.env.GITHUB_TOKEN
 * Query params:
 * - type=pull - returns pull requests instead of issues
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('github_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.split(' ')[1];
  const token = cookieToken ?? headerToken ?? process.env.GITHUB_TOKEN;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (!token) {
    return NextResponse.json({ error: 'No GitHub token provided' }, { status: 401 });
  }

  try {
    const octokit = new Octokit({ auth: token });
    
    if (type === 'pull') {
      // Fetch all issues and pull requests, then filter for PRs
      const res = await octokit.rest.issues.listForAuthenticatedUser({ 
        filter: 'created',
        per_page: 100 
      });
      // Filter to only include pull requests
      const prs = (res.data || []).filter((item: any) => item.pull_request);
      return NextResponse.json(prs);
    } else {
      // Fetch issues (excluding pull requests)
      const res = await octokit.rest.issues.listForAuthenticatedUser({ per_page: 100 });
      // Filter out pull requests
      const issues = (res.data || []).filter((item: any) => !item.pull_request);
      return NextResponse.json(issues);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
