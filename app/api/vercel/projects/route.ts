import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const VERCEL_API_URL = 'https://api.vercel.com/v6';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const vercelToken = cookieStore.get('vercel_token')?.value;

  if (!vercelToken) {
    return NextResponse.json({ error: 'Not authenticated with Vercel', needsAuth: true }, { status: 401 });
  }

  try {
    const projectsRes = await fetch(
      `${VERCEL_API_URL}/projects`,
      {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
        },
      }
    );

    if (!projectsRes.ok) {
      const error = await projectsRes.text();
      console.error('[Vercel] Projects error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: projectsRes.status });
    }

    const projects = await projectsRes.json();

    const formattedProjects = projects.projects?.map((p: any) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      framework: p.framework,
      target: p.target,
      devCommand: p.devCommand,
      buildCommand: p.buildCommand,
      installCommand: p.installCommand,
      serverlessFunctionRegion: p.serverlessFunctionRegion,
      productionDeployment: p.productionDeployment,
      link: p.link,
    })) || [];

    return NextResponse.json(formattedProjects);
  } catch (err) {
    console.error('[Vercel] Fetch error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
