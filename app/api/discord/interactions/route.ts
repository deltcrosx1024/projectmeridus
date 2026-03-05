import { verifyKey } from 'discord-interactions';
import { commands } from '@/app/lib/discord/commands';
import { 
  DiscordInteraction, 
  InteractionType, 
  InteractionResponseType 
} from '@/app/types/discord';
import { handleAutocomplete as handleAutocompleteLogic } from '@/app/lib/discord/autocomplete';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

interface CommandResult {
  content?: string;
  embeds?: unknown[];
  components?: unknown[];
  ephemeral?: boolean;
}

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

  const updateResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repoName}/pulls/${prNumber}/update-branch`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ expected_head_sha: pr.head.sha }),
    }
  );

  if (!updateResponse.ok && updateResponse.status !== 202) {
    const error = await updateResponse.json().catch(() => ({ message: updateResponse.statusText }));
    throw new Error(error.message || `Failed to rebase: ${updateResponse.status}`);
  }
}

function createResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createErrorResponse(message: string, status = 200): Response {
  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: { content: message },
  }, status);
}

function buildCommandResponse(result: CommandResult): Response {
  const responseData: Record<string, unknown> = {
    content: result.content || '',
  };

  if (result.embeds?.length) {
    responseData.embeds = result.embeds;
  }

  if (result.components?.length) {
    responseData.components = result.components;
  }

  if (result.ephemeral) {
    responseData.flags = 64;
  }

  return createResponse({
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: responseData,
  });
}

async function verifyDiscordRequest(request: Request): Promise<{ valid: boolean; body: string }> {
  const signature = request.headers.get('x-signature-ed25519') || '';
  const timestamp = request.headers.get('x-signature-timestamp') || '';

  console.log('[Discord] Headers:', {
    signature: signature ? 'present' : 'missing',
    timestamp: timestamp ? 'present' : 'missing',
    publicKey: DISCORD_PUBLIC_KEY ? 'present' : 'missing',
  });

  if (!DISCORD_PUBLIC_KEY) {
    console.error('[Discord] Public key not configured');
    return { valid: false, body: '' };
  }

  const bodyBuffer = await request.arrayBuffer();
  const body = new TextDecoder('utf-8').decode(bodyBuffer);

  try {
    const isValid = await verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY);
    return { valid: isValid, body };
  } catch (err) {
    console.error('[Discord] Signature verification error:', err);
    return { valid: false, body };
  }
}

function handlePing(): Response {
  console.log('[Discord] Responding to PING with PONG');
  return createResponse({ type: InteractionResponseType.PONG });
}

async function handleApplicationCommand(interaction: DiscordInteraction): Promise<Response> {
  const commandName = interaction.data?.name;

  if (!commandName) {
    console.error('[Discord] No command name in interaction data');
    return createErrorResponse('❌ No command name provided.');
  }

  console.log(`[Discord] Executing command: /${commandName}`);

  const command = commands[commandName];

  if (!command) {
    console.warn(`[Discord] Unknown command: ${commandName}`);
    return createErrorResponse(
      `❌ Unknown command: **${commandName}**\nUse **/list** to see available commands.`
    );
  }

  try {
    const result = await command.execute(interaction);
    console.log(`[Discord] Command /${commandName} executed successfully`);
    return buildCommandResponse(result);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[Discord] Error executing command ${commandName}:`, err);
    return createErrorResponse(`❌ Error executing command: ${errorMessage}`);
  }
}

function createRebaseModal(repo: string, prNumber: string): Response {
  return createResponse({
    type: InteractionResponseType.MODAL,
    data: {
      custom_id: `gh:rebase:${repo}:${prNumber}:execute`,
      title: '⚠️ Confirm Rebase',
      components: [{
        type: 1,
        components: [{
          type: 4,
          custom_id: 'confirm_text',
          label: 'Type "REBASE" to confirm',
          style: 1,
          min_length: 6,
          max_length: 6,
          required: true,
          placeholder: 'REBASE',
        }],
      }],
    },
  });
}

function isRebaseConfirm(customId: string): boolean {
  return customId.startsWith('gh:rebase:') && customId.endsWith(':confirm');
}

function isRebaseExecute(customId: string): boolean {
  return customId.startsWith('gh:rebase:') && customId.endsWith(':execute');
}

function parseRebaseData(customId: string): { repo: string; prNumber: string } | null {
  const parts = customId.split(':');
  if (parts.length < 4) return null;
  return { repo: parts[2], prNumber: parts[3] };
}

async function handleRebaseExecute(repo: string, prNumber: string): Promise<Response> {
  try {
    await executeRebase(repo, prNumber);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `✅ Rebase initiated for **${repo}#${prNumber}**`,
        flags: 64,
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Discord] Rebase error:', err);
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `❌ Failed to rebase: ${errorMessage}`,
        flags: 64,
      },
    });
  }
}

function handleMessageComponent(interaction: DiscordInteraction): Response {
  const customId = interaction.data?.custom_id || '';
  console.log(`[Discord] Component interaction: ${customId}`);

  if (isRebaseConfirm(customId)) {
    const data = parseRebaseData(customId);
    if (data) {
      return createRebaseModal(data.repo, data.prNumber);
    }
  }

  if (customId.startsWith('gh:')) {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `🔄 Action \`${customId}\` received. This feature is coming soon!`,
        flags: 64,
      },
    });
  }

  return createErrorResponse(`✅ You clicked: **${customId}**`);
}

async function handleAutocomplete(interaction: DiscordInteraction): Promise<Response> {
  const choices = await handleAutocompleteLogic(interaction);
  return createResponse({
    type: InteractionResponseType.APPLICATION_COMMAND_AUTOCOMPLETE_RESULT,
    data: { choices },
  });
}

async function handleModalSubmit(interaction: DiscordInteraction): Promise<Response> {
  const customId = interaction.data?.custom_id || '';
  console.log(`[Discord] Modal submit: ${customId}`);

  if (!isRebaseExecute(customId)) {
    return createErrorResponse('✅ Modal submitted successfully!');
  }

  const values = interaction.data?.components?.[0]?.components?.[0]?.value;

  if (values !== 'REBASE') {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Rebase cancelled. You did not type "REBASE" correctly.',
        flags: 64,
      },
    });
  }

  const data = parseRebaseData(customId);
  if (!data) {
    return createResponse({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❌ Invalid rebase data.',
        flags: 64,
      },
    });
  }

  return handleRebaseExecute(data.repo, data.prNumber);
}

function handleUnknownType(type: number): Response {
  console.warn(`[Discord] Unhandled interaction type: ${type}`);
  return createResponse(
    { error: `Unhandled interaction type: ${type}` },
    400
  );
}

async function dispatchInteraction(interaction: DiscordInteraction): Promise<Response> {
  switch (interaction.type) {
    case InteractionType.PING:
      return handlePing();
    case InteractionType.APPLICATION_COMMAND:
      return handleApplicationCommand(interaction);
    case InteractionType.MESSAGE_COMPONENT:
      return handleMessageComponent(interaction);
    case InteractionType.APPLICATION_COMMAND_AUTOCOMPLETE:
      return handleAutocomplete(interaction);
    case InteractionType.MODAL_SUBMIT:
      return handleModalSubmit(interaction);
    default:
      return handleUnknownType(interaction.type);
  }
}

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  return new Response('', { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  const { valid, body } = await verifyDiscordRequest(request);

  if (!valid) {
    console.error('[Discord] Invalid signature');
    return createResponse({ error: 'Invalid request signature' }, 401);
  }

  console.log('[Discord] Signature verified successfully');

  const interaction = JSON.parse(body) as DiscordInteraction;
  console.log(`[Discord] Received interaction type: ${interaction.type}`);

  return dispatchInteraction(interaction);
}
