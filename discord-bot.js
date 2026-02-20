/**
 * Simple Discord Bot for Keeping Bot Online
 * Run this separately (not on Vercel) to make your bot show as "Online"
 * 
 * Usage:
 * 1. Run: npm install discord.js
 * 2. Run: node discord-bot.js
 * 
 * Or use with pm2 for production: pm2 start discord-bot.js
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');

const token = process.env.DISCORD_TOKEN || 'YOUR_BOT_TOKEN_HERE';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is online! Logged in as ${readyClient.user.tag}`);
  console.log(`   User ID: ${readyClient.user.id}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'ping') {
    await interaction.reply('🏓 Pong! (from live bot)');
  } else if (commandName === 'hello') {
    await interaction.reply('👋 Hello from the live bot!');
  }
});

client.on(Events.Error, (error) => {
  console.error('❌ Discord client error:', error);
});

console.log('🤖 Starting Discord bot...');
client.login(token);
