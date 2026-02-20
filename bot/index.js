/**
 * Discord Bot for Railway/Render Deployment
 * 
 * Setup for Railway:
 * 1. Create a new project on Railway
 * 2. Connect your GitHub repo
 * 3. Set root directory to: bot
 * 4. Add environment variable: DISCORD_TOKEN
 * 5. Deploy
 * 
 * Setup for Render:
 * 1. Create a new Web Service
 * 2. Connect your GitHub repo
 * 3. Set root directory to: bot
 * 4. Add environment variable: DISCORD_TOKEN
 * 5. Set start command: node index.js
 */

const { Client, GatewayIntentBits, Events, REST, Routes } = require('discord.js');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;

if (!token) {
  console.error('❌ DISCORD_TOKEN environment variable is required');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Slash commands to register
const commands = [
  {
    name: 'ping',
    description: 'Replies with Pong!',
  },
  {
    name: 'hello',
    description: 'Says Hello!',
  },
  {
    name: 'repo',
    description: 'Get repository info',
    options: [
      {
        name: 'owner',
        type: 3, // STRING
        description: 'Repository owner',
        required: true,
      },
      {
        name: 'repo',
        type: 3, // STRING
        description: 'Repository name',
        required: true,
      },
    ],
  },
];

// Register slash commands
async function registerCommands() {
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    
    console.log('📝 Registering slash commands...');
    
    if (clientId && guildId) {
      // Register to specific guild (faster)
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      console.log('✅ Slash commands registered to guild');
    } else if (clientId) {
      // Register globally (can take up to 1 hour)
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      console.log('✅ Slash commands registered globally');
    }
  } catch (error) {
    console.error('❌ Failed to register commands:', error);
  }
}

client.once(Events.ClientReady, async () => {
  console.log(`✅ Bot is online! Logged in as ${client.user.tag}`);
  console.log(`   User ID: ${client.user.id}`);
  
  // Register commands
  await registerCommands();
  
  // Set presence
  client.user.setPresence({
    activities: [{
      name: 'DeltCrosX DevHub',
      type: 0, // PLAYING
    }],
    status: 'online',
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    switch (commandName) {
      case 'ping':
        await interaction.reply('🏓 Pong!');
        break;
        
      case 'hello':
        await interaction.reply('👋 Hello! Thanks for using DeltCrosX DevHub!');
        break;
        
      case 'repo': {
        const owner = interaction.options.getString('owner');
        const repo = interaction.options.getString('repo');
        await interaction.reply(`📦 **${owner}/${repo}**\nhttps://github.com/${owner}/${repo}`);
        break;
      }
      
      default:
        await interaction.reply(`❌ Unknown command: ${commandName}`);
    }
  } catch (error) {
    console.error('❌ Command error:', error);
    await interaction.reply('❌ An error occurred while executing this command.');
  }
});

client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Shutting down bot...');
  client.destroy();
  process.exit(0);
});

console.log('🤖 Starting Discord bot...');
client.login(token);
