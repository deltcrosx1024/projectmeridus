import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Octokit } from 'octokit';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get('github_token')?.value;
  const authHeader = request.headers.get('authorization');
  const headerToken = authHeader?.split(' ')[1];
  
  const token = cookieToken ?? headerToken ?? process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated. Please log in with GitHub.', needsAuth: true }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const perPage = parseInt(searchParams.get('per_page') || '30');

  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    
    const res = await octokit.rest.activity.listEventsForAuthenticatedUser({
      username: user.login,
      per_page: perPage,
    });
    
    const events = res.data.map(event => {
      if (!event.type) return null;
      
      let type: 'commit' | 'issue' | 'pr' | 'release' | 'fork' | 'star' | 'watch' | 'other' = 'other';
      let message = '';
      let repo = event.repo.name;
      
      switch (event.type) {
        case 'PushEvent':
          type = 'commit';
          const commits = (event.payload as any).commits || [];
          message = commits.length > 0 
            ? `Pushed ${commits.length} commit${commits.length > 1 ? 's' : ''}: ${commits[0].message.split('\n')[0]}`
            : 'Pushed commits';
          break;
        case 'IssuesEvent':
          type = 'issue';
          const issueAction = (event.payload as any).action;
          const issueNumber = (event.payload as any).issue?.number;
          message = issueAction === 'opened' 
            ? `Opened issue #${issueNumber}: ${(event.payload as any).issue?.title}`
            : `${issueAction} issue #${issueNumber}`;
          break;
        case 'PullRequestEvent':
          type = 'pr';
          const prAction = (event.payload as any).action;
          const prNumber = (event.payload as any).pull_request?.number;
          const prTitle = (event.payload as any).pull_request?.title;
          if (prAction === 'opened') {
            message = `Opened PR #${prNumber}: ${prTitle}`;
          } else if (prAction === 'closed' && (event.payload as any).pull_request?.merged) {
            message = `Merged PR #${prNumber}: ${prTitle}`;
          } else {
            message = `${prAction} PR #${prNumber}: ${prTitle}`;
          }
          break;
        case 'ReleaseEvent':
          type = 'release';
          const releaseAction = (event.payload as any).action;
          const releaseTag = (event.payload as any).release?.tag_name;
          message = releaseAction === 'published' 
            ? `Released ${releaseTag}`
            : `${releaseAction} release ${releaseTag}`;
          break;
        case 'ForkEvent':
          type = 'fork';
          message = `Forked ${repo}`;
          break;
        case 'WatchEvent':
          type = 'star';
          message = `Starred ${repo}`;
          break;
        default:
          message = `${event.type.replace('Event', '')} on ${repo}`;
      }

      return {
        id: event.id,
        type,
        actor: {
          login: event.actor.login,
          avatar_url: event.actor.avatar_url,
        },
        repo,
        message,
        timestamp: event.created_at,
        url: event.repo.url,
      };
    }).filter(Boolean);

    return NextResponse.json(events);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
