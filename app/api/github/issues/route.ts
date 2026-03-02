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
  
  // Use user's token first, fall back to server token for Discord bot
  const token = cookieToken ?? headerToken ?? process.env.GITHUB_TOKEN;
  const url = new URL(request.url);
  const type = url.searchParams.get('type');

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated. Please log in with GitHub.', needsAuth: true }, { status: 401 });
  }

  try {
    const octokit = new Octokit({ auth: token });
    
    // Use the Search API across the user's repositories so we count issues/PRs
    // that exist in the repos the user owns or has access to. This returns
    // consistent counts even if the user didn't "create" the issue/PR.
    const reposRes = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 100 });
    const repoQualifiers = (reposRes.data || []).map((r: any) => `repo:${r.owner.login}/${r.name}`);

    if (repoQualifiers.length === 0) return NextResponse.json([]);

    const repoQuery = repoQualifiers.join(' ');

    if (type === 'pull') {
      const q = `${repoQuery} is:pr`;
      const searchRes = await octokit.rest.search.issuesAndPullRequests({ q, per_page: 100 });
      return NextResponse.json(searchRes.data.items || []);
    } else {
      const q = `${repoQuery} is:issue`;
      const searchRes = await octokit.rest.search.issuesAndPullRequests({ q, per_page: 100 });
      // Filter out any PRs just in case
      const issues = (searchRes.data.items || []).filter((it: any) => !it.pull_request);
      return NextResponse.json(issues);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
