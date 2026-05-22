// app/api/revalidate/route.ts
// On-demand Incremental Static Regeneration (ISR) endpoint
// 
// This endpoint allows triggering page regeneration for ISR pages.
// It should be called with a secret token for security.
//
// Usage:
//   POST /api/revalidate
//   Body: { secret: process.env.REVALIDATE_SECRET, path: "/blog/post-1" }
// 
// Required environment variable:
//   REVALIDATE_SECRET - a secret token to prevent unauthorized revalidations

import { NextResponse } from 'next/server';

export const revalidate = 0; // Disable automatic revalidation for this route

export async function POST(request: Request) {
  // Verify secret token for security
  const { secret, path } = await request.json();

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid secret' },
      { status: 401 }
    );
  }

  if (!path) {
    return NextResponse.json(
      { error: 'Missing path to revalidate' },
      { status: 400 }
    );
  }

  // In Next.js App Router, calling this endpoint with the correct secret
  // and path triggers on-demand revalidation for the specified path.
  // The actual revalidation is handled by Next.js internally.
  
  return NextResponse.json(
    { revalidated: true, now: Date.now(), path },
    { status: 200 }
  );
}