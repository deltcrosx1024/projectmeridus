import { NextResponse } from 'next/server';
import { Octokit } from 'octokit';

/**
 * GET /api/github/repo/[owner]/[repo]/issues
 * Returns issues for a specific repository.
 * Accepts Authorization: Bearer <token> header or falls back to process.env.GITHUB_TOKEN
 */
export async function GET(
  request: Request,
  { params }: { params: { owner: string; repo: string } }
) {
  const { owner, repo } = params;
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1] ?? process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'No GitHub token provided' }, { status: 401 });
  }

  try {
    const octokit = new Octokit({ auth: token });
    const res = await octokit.rest.issues.listForRepo({ owner, repo, per_page: 100 });
    return NextResponse.json(res.data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
