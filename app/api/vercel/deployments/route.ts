import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const VERCEL_API_URL = 'https://api.vercel.com/v6';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const vercelToken = cookieStore.get('vercel_token')?.value;
  const vercelUserCookie = cookieStore.get('vercel_user')?.value;

  if (!vercelToken) {
    return NextResponse.json({ error: 'Not authenticated with Vercel', needsAuth: true }, { status: 401 });
  }

  // Get team ID from stored user data
  let teamId = '';
  let teamSlug = '';
  if (vercelUserCookie) {
    try {
      const userData = JSON.parse(vercelUserCookie);
      teamId = userData.teamId || '';
      teamSlug = userData.teamSlug || '';
    } catch (e) {
      console.error('[Vercel] Failed to parse vercel_user cookie:', e);
    }
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    let allDeployments: any[] = [];
    let hasMore = false;

    // If user has a team, fetch from team endpoint
    if (teamId) {
      console.log('[Vercel] Fetching team deployments for team:', teamId);
      
      // Try team endpoint first
      const teamApiUrl = `${VERCEL_API_URL}/teams/${teamId}/deployments?limit=${limit}`;
      const teamRes = await fetch(teamApiUrl, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
        },
      });

      if (teamRes.ok) {
        const teamData = await teamRes.json();
        allDeployments = teamData.deployments || [];
        hasMore = teamData.pagination?.count >= limit;
        console.log('[Vercel] Team deployments found:', allDeployments.length);
      } else {
        console.error('[Vercel] Team deployments error:', await teamRes.text());
        
        // Fallback to regular endpoint with teamId param
        const fallbackUrl = `${VERCEL_API_URL}/deployments?limit=${limit}&teamId=${teamId}`;
        const fallbackRes = await fetch(fallbackUrl, {
          headers: {
            'Authorization': `Bearer ${vercelToken}`,
          },
        });
        
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          allDeployments = fallbackData.deployments || [];
          console.log('[Vercel] Fallback deployments found:', allDeployments.length);
        }
      }
    } 
    
    // Also fetch personal deployments if no team deployments
    if (allDeployments.length === 0) {
      console.log('[Vercel] Fetching personal deployments');
      const personalApiUrl = `${VERCEL_API_URL}/deployments?limit=${limit}`;
      const personalRes = await fetch(personalApiUrl, {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
        },
      });

      if (personalRes.ok) {
        const personalData = await personalRes.json();
        allDeployments = personalData.deployments || [];
        console.log('[Vercel] Personal deployments found:', allDeployments.length);
      }
    }

    const formattedDeployments = allDeployments.map((d: any) => ({
      uid: d.uid,
      name: d.name,
      state: d.state,
      created: d.created,
      ready: d.ready,
      meta: d.meta,
      branch: d.meta?.githubCommitRef || d.meta?.gitlabRef || d.meta?.bitbucketCommitHash || 'main',
      commit: d.meta?.githubCommitMessage || d.meta?.gitlabCommitMessage || '',
      commitSha: d.meta?.githubCommitSha || d.meta?.gitlabCommitSha || '',
      creator: d.creator?.username || d.creator?.email || 'unknown',
      buildId: d.buildId,
      routes: d.routes,
      target: d.target,
      alias: d.alias,
      env: d.env,
      regions: d.regions,
      plan: d.plan,
      projectId: d.projectId,
      teamId: d.teamId || teamId,
    }));

    console.log('[Vercel] Total deployments:', formattedDeployments.length);
    return NextResponse.json(formattedDeployments);
  } catch (err) {
    console.error('[Vercel] Fetch error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
