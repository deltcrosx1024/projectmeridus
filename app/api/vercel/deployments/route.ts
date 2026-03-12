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
  if (vercelUserCookie) {
    try {
      const userData = JSON.parse(vercelUserCookie);
      teamId = userData.teamId || '';
    } catch (e) {
      console.error('[Vercel] Failed to parse vercel_user cookie:', e);
    }
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    let apiUrl = `${VERCEL_API_URL}/deployments?limit=${limit}`;
    if (teamId) {
      apiUrl += `&teamId=${teamId}`;
    }
    console.log('[Vercel] Fetching deployments from:', apiUrl);

    const deploymentsRes = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
      },
    });

    if (!deploymentsRes.ok) {
      const errorText = await deploymentsRes.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: { message: errorText } };
      }
      
      console.error('[Vercel] Deployments error:', errorData);
      
      if (errorData.error?.code === 'forbidden' || errorData.error?.invalidToken) {
        return NextResponse.json({ 
          error: 'Vercel authorization expired. Please reconnect your Vercel account.',
          needsReauth: true 
        }, { status: 403 });
      }
      
      return NextResponse.json({ error: errorData.error?.message || 'Failed to fetch deployments' }, { status: deploymentsRes.status });
    }

    const deployments = await deploymentsRes.json();

    const formattedDeployments = deployments.deployments?.map((d: any) => ({
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
    })) || [];

    return NextResponse.json(formattedDeployments);
  } catch (err) {
    console.error('[Vercel] Fetch error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
