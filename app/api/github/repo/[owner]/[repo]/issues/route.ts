import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * GET /api/github/repo/[owner]/[repo]/issues
 * Returns issues for a specific repository.
 * Accepts Authorization: Bearer <token> header or falls back to cookie token or process.env.GITHUB_TOKEN
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ owner: string; repo: string }> }
) {
  const { owner, repo } = await params;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('github_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.split(' ')[1];
  const token = cookieToken ?? headerToken ?? process.env.GITHUB_TOKEN;

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
