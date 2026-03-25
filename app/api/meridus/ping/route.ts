import { NextResponse } from 'next/server';

/**
 * GET /api/meridus/ping
 * Lightweight health check endpoint for measuring API responsiveness
 * Returns quickly without making external API calls
 */
export async function GET() {
  const start = Date.now();
  
  // Simulate minimal processing (no external calls)
  const serverTime = Date.now() - start;
  
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    responseTime: serverTime,
    message: 'Server is responsive'
  }, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}