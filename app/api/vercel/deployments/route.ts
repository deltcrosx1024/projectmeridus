import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const VERCEL_API_URL = 'https://api.vercel.com/v6';

function decodeJwt(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const vercelToken = cookieStore.get('vercel_token')?.value;
  const vercelUserCookie = cookieStore.get('vercel_user')?.value;

  if (!vercelToken) {
    return NextResponse.json({ error: 'Not authenticated with Vercel', needsAuth: true }, { status: 401 });
  }

  // Decode token to get team info
  const decodedToken = decodeJwt(vercelToken);
  console.log('[Vercel] Decoded token:', decodedToken);
  
  let teamId = '';
  let teamSlug = '';
  
  // First try from cookie
  if (vercelUserCookie) {
    try {
      const userData = JSON.parse(vercelUserCookie);
      teamId = userData.teamId || '';
      teamSlug = userData.teamSlug || '';
      console.log('[Vercel] User data from cookie:', userData);
    } catch (e) {
      console.error('[Vercel] Failed to parse vercel_user cookie:', e);
    }
  }
  
  // Override with token data if available
  if (!teamId && decodedToken?.team_id) {
    teamId = decodedToken.team_id;
    teamSlug = decodedToken.team_slug || '';
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    const allDeployments: any[] = [];

    // Method 1: Try /v6/teams/{teamId}/deployments
    if (teamId) {
      console.log('[Vercel] Method 1: Team deployments, teamId:', teamId);
      const url1 = `https://api.vercel.com/v6/teams/${teamId}/deployments?limit=${limit}`;
      const res1 = await fetch(url1, { headers: { 'Authorization': `Bearer ${vercelToken}` } });
      if (res1.ok) {
        const data1 = await res1.json();
        if (data1.deployments?.length > 0) {
          allDeployments.push(...data1.deployments);
          console.log('[Vercel] Method 1 success:', data1.deployments.length);
        }
      } else {
        console.log('[Vercel] Method 1 failed:', res1.status, await res1.text());
      }
    }

    // Method 2: Try /v6/deployments?teamId={teamId}
    if (allDeployments.length === 0 && teamId) {
      console.log('[Vercel] Method 2: Deployments with teamId param');
      const url2 = `https://api.vercel.com/v6/deployments?limit=${limit}&teamId=${teamId}`;
      const res2 = await fetch(url2, { headers: { 'Authorization': `Bearer ${vercelToken}` } });
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2.deployments?.length > 0) {
          allDeployments.push(...data2.deployments);
          console.log('[Vercel] Method 2 success:', data2.deployments.length);
        }
      } else {
        console.log('[Vercel] Method 2 failed:', res2.status);
      }
    }

    // Method 3: Get projects then deployments for each
    if (allDeployments.length === 0) {
      console.log('[Vercel] Method 3: Get projects then deployments');
      let projectsUrl = `https://api.vercel.com/v6/projects?limit=50`;
      if (teamId) projectsUrl += `&teamId=${teamId}`;
      if (teamSlug) projectsUrl += `&teamSlug=${teamSlug}`;
      
      const projectsRes = await fetch(projectsUrl, { headers: { 'Authorization': `Bearer ${vercelToken}` } });
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        console.log('[Vercel] Projects found:', projectsData.projects?.length);
        
        for (const project of projectsData.projects || []) {
          let dUrl = `https://api.vercel.com/v6/projects/${project.id}/deployments?limit=10`;
          if (teamId) dUrl += `&teamId=${teamId}`;
          
          const dRes = await fetch(dUrl, { headers: { 'Authorization': `Bearer ${vercelToken}` } });
          if (dRes.ok) {
            const dData = await dRes.json();
            if (dData.deployments?.length > 0) {
              allDeployments.push(...dData.deployments);
            }
          }
        }
        console.log('[Vercel] Method 3 total:', allDeployments.length);
      }
    }

    // Method 4: Try /v6/deployments without team filter
    if (allDeployments.length === 0) {
      console.log('[Vercel] Method 4: Personal deployments');
      const url4 = `https://api.vercel.com/v6/deployments?limit=${limit}`;
      const res4 = await fetch(url4, { headers: { 'Authorization': `Bearer ${vercelToken}` } });
      if (res4.ok) {
        const data4 = await res4.json();
        if (data4.deployments?.length > 0) {
          allDeployments.push(...data4.deployments);
          console.log('[Vercel] Method 4 success:', data4.deployments.length);
        }
      }
    }

    // Sort and format
    allDeployments.sort((a, b) => b.created - a.created);
    const formatted = allDeployments.slice(0, limit).map(d => ({
      uid: d.uid,
      name: d.name,
      state: d.state,
      created: d.created,
      ready: d.ready,
      branch: d.meta?.githubCommitRef || d.meta?.gitlabRef || 'main',
      commit: d.meta?.githubCommitMessage || '',
      commitSha: d.meta?.githubCommitSha || '',
      creator: d.creator?.username || 'unknown',
      alias: d.alias,
      projectId: d.projectId,
      teamId: d.teamId || teamId,
    }));

    console.log('[Vercel] Final deployments:', formatted.length);
    return NextResponse.json(formatted);
  } catch (err) {
    console.error('[Vercel] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
