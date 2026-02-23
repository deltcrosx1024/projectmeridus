import { NextResponse } from 'next/server';

const getBotUrl = (): string => {
  return process.env.MERIDUS_BOT_URL || 'http://localhost:3000';
};

const getApiKey = (): string => {
  return process.env.MERIDUS_API_KEY || '';
};

export async function GET() {
  const botUrl = getBotUrl();
  const apiKey = getApiKey();

  console.log(`[MeridusBot Status] Checking bot at ${botUrl}`);

  if (!apiKey) {
    return NextResponse.json(
      { status: 'error', error: 'MERIDUS_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${botUrl}/`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
      },
    });

    if (response.ok) {
      const botData = await response.json();
      console.log('[MeridusBot Status] Bot is online:', botData);
      return NextResponse.json({
        status: 'ok',
        connected: true,
        bot: botData.bot || 'MeridusBot',
        version: botData.version || '1.0.0',
        botResponse: botData,
      });
    } else {
      console.error(`[MeridusBot Status] Bot returned ${response.status}`);
      return NextResponse.json({
        status: 'error',
        connected: false,
        error: `Bot returned status ${response.status}`,
      }, { status: response.status });
    }
  } catch (err: any) {
    console.error('[MeridusBot Status] Connection error:', err);
    return NextResponse.json({
      status: 'error',
      connected: false,
      error: err.message || 'Failed to connect to bot',
    }, { status: 500 });
  }
}
