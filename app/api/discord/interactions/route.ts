import { NextResponse } from 'next/server';
import { verifyKey } from 'discord-interactions';
import { commands } from '@/app/lib/discord/commands';
import { 
  DiscordInteraction, 
  InteractionType, 
  InteractionResponseType 
} from '@/app/types/discord';

const DISCORD_PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY || '';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('', { status: 200 });
}

export async function POST(request: Request) {
  // Get headers for Discord signature verification
  const signature = request.headers.get('x-signature-ed25519') || '';
  const timestamp = request.headers.get('x-signature-timestamp') || '';
  const body = await request.text();

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

  // Verify Discord signature
  const isValidRequest = verifyKey(body, signature, timestamp, DISCORD_PUBLIC_KEY);

  if (!isValidRequest) {
    console.error('[Discord] Invalid signature');
    return new Response(
      JSON.stringify({ error: 'Invalid signature' }), 
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

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
    console.log(`[Discord] Modal submit: ${interaction.data?.custom_id}`);
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
