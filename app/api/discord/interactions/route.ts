import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { Octokit } from 'octokit';
import { verifyKey } from 'discord-interactions';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('', { status: 200 });
}

export async function POST(request: Request) {
  const signature = request.headers.get('x-signature-ed25519') || '';
  const timestamp = request.headers.get('x-signature-timestamp') || '';
  const body = await request.text();

  if (!DISCORD_PUBLIC_KEY) {
    console.error('[Discord] Public key not configured');
    return new Response('{"error":"Server not configured"}', {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const isValidRequest = await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY);

  if (!isValidRequest) {
    console.error('[Discord] Invalid signature');
    return new Response('{"error":"Invalid signature"}', {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const interaction = JSON.parse(body);

  if (interaction.type === 1) {
    return new Response('{"type":1}', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (interaction.type === 2) {
      const commandName = interaction.data?.name;

      if (commandName === 'ping') {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '🏓 Pong!' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (commandName === 'hello') {
        return new Response(JSON.stringify({
          type: 4,
          data: { content: '👋 Hello from Meridus!' }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (commandName === 'status') {
        const botUrl = process.env.MERIDUS_BOT_URL || 'https://www.meridusdev.in.th';
        return new Response(JSON.stringify({
          type: 4,
          data: { content: `📊 **Meridus Bot Status**\n\n🌐 API URL: ${botUrl}\n✅ Status: Online\n🔒 HTTPS: Enabled` }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (commandName === 'repos') {
        try {
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            return new Response(JSON.stringify({
              type: 4,
              data: { content: '❌ GitHub token not configured on server.' }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          const octokit = new Octokit({ auth: githubToken });
          const res = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 5 });
          const repos = res.data.map((r: any) => `• ${r.full_name} (⭐ ${r.stargazers_count})`).join('\n');
          return new Response(JSON.stringify({
            type: 4,
            data: { content: `📂 **Your GitHub Repositories:**\n${repos}` }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err) {
          return new Response(JSON.stringify({
            type: 4,
            data: { content: `❌ Error fetching repos: ${err}` }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      if (commandName === 'issues') {
        try {
          const githubToken = process.env.GITHUB_TOKEN;
          if (!githubToken) {
            return new Response(JSON.stringify({
              type: 4,
              data: { content: '❌ GitHub token not configured on server.' }
            }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          const octokit = new Octokit({ auth: githubToken });
          const searchRes = await octokit.rest.search.issuesAndPullRequests({
            q: 'is:issue author:@me',
            per_page: 5,
          });
          const issues = searchRes.data.items?.map((i: any) => `• ${i.title} (#${i.number})`).join('\n') || 'No issues found';
          return new Response(JSON.stringify({
            type: 4,
            data: { content: `🐛 **Your GitHub Issues:**\n${issues}` }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (err) {
          return new Response(JSON.stringify({
            type: 4,
            data: { content: `❌ Error fetching issues: ${err}` }
          }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({
        type: 4,
        data: { content: `❌ Unknown command: ${commandName}` }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (interaction.type === 3) {
      const customId = interaction.data?.custom_id;
      return new Response(JSON.stringify({
        type: 4,
        data: { content: `✅ You clicked: ${customId}` }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response('{"error":"Unhandled interaction type"}', {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[Discord] Error:', err);
    return new Response(`{"error":"${err}"}`, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
