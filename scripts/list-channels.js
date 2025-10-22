import { Client, GatewayIntentBits } from 'discord.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Read token from .env file
const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf-8');
const token = envFile
  .split('\n')
  .find(line => line.startsWith('DISCORD_TOKEN='))
  ?.split('=')[1]
  .trim();

if (!token) {
  console.error('❌ DISCORD_TOKEN not found in .env file');
  console.error('Please create a .env file with your Discord bot token:');
  console.error('  cp .env.example .env');
  console.error('  # Edit .env and add your token');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const guild = client.guilds.cache.first();
  if (guild) {
    console.log(`\nGuild: ${guild.name}\n`);
    console.log('All Channels:');
    guild.channels.cache.forEach(channel => {
      const typeNames = {
        0: 'TEXT',
        2: 'VOICE',
        4: 'CATEGORY',
        5: 'ANNOUNCEMENT',
        10: 'ANNOUNCEMENT_THREAD',
        11: 'PUBLIC_THREAD',
        12: 'PRIVATE_THREAD',
        13: 'STAGE_VOICE',
        14: 'DIRECTORY',
        15: 'FORUM',
        16: 'MEDIA'
      };
      console.log(`  [${typeNames[channel.type] || channel.type}] ${channel.name}: ${channel.id}`);
    });
  }

  client.destroy();
  process.exit(0);
});

client.login(token);
