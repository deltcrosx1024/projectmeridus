import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

/**
 * GET /api/github/commits
 * Returns recent commits from all repositories for the authenticated user.
 * Accepts Authorization: Bearer <token> header or falls back to process.env.GITHUB_TOKEN
 * 
 * Query params:
 * - per_repo: number of commits per repository (default: 5)
 * - max_repos: maximum number of repositories to fetch (default: 10)
 * 
 * Performance optimizations:
 * - Reduced default max_repos to 5 for faster response
 * - Caching headers for CDN/browser
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('github_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.split(' ')[1];
  
  // Use user's token only - do NOT fall back to hardcoded token
  // This prevents showing wrong user's data
  const token = cookieToken ?? headerToken;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated. Please log in with GitHub.', needsAuth: true }, { status: 401 });
  }

  const url = new URL(request.url);
  const perRepo = parseInt(url.searchParams.get('per_repo') || '5', 10);
  const maxRepos = parseInt(url.searchParams.get('max_repos') || '5', 10); // Reduced from 10 to 5

  try {
    const octokit = new Octokit({ auth: token });
    
    // First get all repositories for the authenticated user
    const reposRes = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: maxRepos,
      sort: 'updated',
      direction: 'desc'
    });

    const repos = reposRes.data;
    
    // Fetch commits for each repository
    const allCommits = await Promise.all(
      repos.map(async (repo) => {
        try {
          const commitsRes = await octokit.rest.repos.listCommits({
            owner: repo.owner!.login,
            repo: repo.name,
            per_page: perRepo
          });
          
          return commitsRes.data.map(commit => ({
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author?.name || 'Unknown',
            date: commit.commit.author?.date,
            url: commit.html_url,
            repo_name: repo.name,
            repo_owner: repo.owner!.login,
            avatar_url: commit.author?.avatar_url
          }));
        } catch (err) {
          console.error(`Error fetching commits for ${repo.name}:`, err);
          return [];
        }
      })
    );

    // Flatten and sort all commits by date (most recent first)
    const flatCommits = allCommits
      .flat()
      .filter(commit => commit.date)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    return NextResponse.json(flatCommits.slice(0, 20), {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'Vary': 'Cookie, Authorization',
      },
    });
  } catch (err: any) {
    console.error('GitHub commits error:', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
