import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { commands } from '@/app/lib/discord/commands';
import { 
  DiscordInteraction, 
  InteractionType, 
  InteractionResponseType 
} from '@/app/types/discord';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

/**
 * Execute a rebase via GitHub API
 */
async function executeRebase(repo: string, prNumber: string): Promise<void> {
  const [owner, repoName] = repo.split('/');
  if (!owner || !repoName) {
    throw new Error('Invalid repository format');
  }

  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    throw new Error('GitHub token not configured');
  }

  // Get PR details to find the head branch
  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );

  if (!prResponse.ok) {
    throw new Error(`Failed to get PR details: ${prResponse.statusText}`);
  }

  const pr = await prResponse.json();

  // Update the PR branch with base branch changes (rebase)
  const updateResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/update-branch`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        expected_head_sha: pr.head.sha,
      }),
    }
  );

  if (!updateResponse.ok && updateResponse.status !== 202) {
    const error = await updateResponse.json().catch(() => ({ message: updateResponse.statusText }));
    throw new Error(error.message || `Failed to rebase: ${updateResponse.status}`);
  }
}

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('', { status: 200 });
}

export async function POST(request: Request) {
  // Get headers for Discord signature verification (case-insensitive)
  const signature = request.headers.get('x-signature-ed25519') || '';
  const timestamp = request.headers.get('x-signature-timestamp') || '';

  // Log headers for debugging (remove in production after fixing)
  console.log('[Discord] Headers:', {
    signature: signature ? 'present' : 'missing',
    timestamp: timestamp ? 'present' : 'missing',
    publicKey: DISCORD_PUBLIC_KEY ? 'present' : 'missing',
  });

  // Validate public key is configured
  if (!DISCORD_PUBLIC_KEY) {
    console.error('[Discord] Public key not configured');
    return new Response(
      JSON.stringify({ error: 'Server not configured' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Read raw body as bytes for signature verification
  const bodyBuffer = await request.arrayBuffer();
  const body = new TextDecoder('utf-8').decode(bodyBuffer);

  // Verify Discord signature
  let isValidRequest = false;
  try {
    isValidRequest = await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY);
  } catch (err) {
    console.error('[Discord] Signature verification error:', err);
  }

  if (!isValidRequest) {
    console.error('[Discord] Invalid signature');
    return new Response(
      JSON.stringify({ error: 'Invalid request signature' }), 
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  console.log('[Discord] Signature verified successfully');

  // Parse the interaction payload
  const interaction = JSON.parse(body) as DiscordInteraction;
  
  console.log(`[Discord] Received interaction type: ${interaction.type}`);

  // Handle PING (type 1) - Discord verification
  if (interaction.type === InteractionType.PING) {
    console.log('[Discord] Responding to PING with PONG');
    return new Response(
      JSON.stringify({ type: InteractionResponseType.PONG }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle APPLICATION_COMMAND (type 2) - Slash commands
  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interaction.data?.name;
    
    if (!commandName) {
      console.error('[Discord] No command name in interaction data');
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: '❌ No command name provided.' }
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    console.log(`[Discord] Executing command: /${commandName}`);
    
    // Look up command handler
    const command = commands[commandName];
    
    if (!command) {
      console.warn(`[Discord] Unknown command: ${commandName}`);
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { 
            content: `❌ Unknown command: **${commandName}**\nUse **/list** to see available commands.` 
          }
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Execute the command handler
    try {
      const result = await command.execute(interaction);
      
      // Build Discord response
      const responseData: any = {
        content: result.content || '',
      };
      
      if (result.embeds && result.embeds.length > 0) {
        responseData.embeds = result.embeds;
      }
      
      if (result.components && result.components.length > 0) {
        responseData.components = result.components;
      }
      
      if (result.ephemeral) {
        responseData.flags = 64; // EPHEMERAL flag
      }
      
      console.log(`[Discord] Command /${commandName} executed successfully`);
      
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: responseData
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: any) {
      console.error(`[Discord] Error executing command ${commandName}:`, err);
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { 
            content: `❌ Error executing command: ${err.message || 'Unknown error'}` 
          }
        }), 
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // Handle MESSAGE_COMPONENT (type 3) - Buttons, select menus
  if (interaction.type === InteractionType.MESSAGE_COMPONENT) {
    const customId = interaction.data?.custom_id;
    console.log(`[Discord] Component interaction: ${customId}`);

    // Handle rebase confirmation
    if (customId?.startsWith('gh:rebase:') && customId.endsWith(':confirm')) {
      // Show confirmation modal
      const parts = customId.split(':');
      const repo = parts[2];
      const prNumber = parts[3];

      return new Response(
        JSON.stringify({
          type: InteractionResponseType.MODAL,
          data: {
            custom_id: `gh:rebase:${repo}:${prNumber}:execute`,
            title: '⚠️ Confirm Rebase',
            components: [{
              type: 1, // Action Row
              components: [{
                type: 4, // Text Input
                custom_id: 'confirm_text',
                label: 'Type "REBASE" to confirm',
                style: 1, // Short
                min_length: 6,
                max_length: 6,
                required: true,
                placeholder: 'REBASE',
              }],
            }],
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Handle other GitHub actions (placeholder for now)
    if (customId?.startsWith('gh:')) {
      return new Response(
        JSON.stringify({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `🔄 Action \`${customId}\` received. This feature is coming soon!`,
            flags: 64, // Ephemeral
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `✅ You clicked: **${customId}**` }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle APPLICATION_COMMAND_AUTOCOMPLETE (type 4)
  if (interaction.type === InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE) {
    return new Response(
      JSON.stringify({
        type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
        data: { choices: [] }
      }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Handle MODAL_SUBMIT (type 5)
  if (interaction.type === InteractionType.MODAL_SUBMIT) {
    const customId = interaction.data?.custom_id;
    console.log(`[Discord] Modal submit: ${customId}`);

    // Handle rebase confirmation
    if (customId?.startsWith('gh:rebase:') && customId.endsWith(':execute')) {
      const values = interaction.data?.components?.[0]?.components?.[0]?.value;

      if (values !== 'REBASE') {
        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '❌ Rebase cancelled. You did not type "REBASE" correctly.',
              flags: 64, // Ephemeral
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const parts = customId.split(':');
      const repo = parts[2];
      const prNumber = parts[3];

      // Execute rebase via GitHub API
      try {
        await executeRebase(repo, prNumber);

        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `✅ Rebase initiated for **${repo}#${prNumber}**`,
              flags: 64, // Ephemeral
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } catch (err: any) {
        console.error('[Discord] Rebase error:', err);
        return new Response(
          JSON.stringify({
            type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: `❌ Failed to rebase: ${err.message || 'Unknown error'}`,
              flags: 64, // Ephemeral
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: '✅ Modal submitted successfully!' }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Unknown interaction type
  console.warn(`[Discord] Unhandled interaction type: ${interaction.type}`);
  return new Response(
    JSON.stringify({ error: `Unhandled interaction type: ${interaction.type}` }), 
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
