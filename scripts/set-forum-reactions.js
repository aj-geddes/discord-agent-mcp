import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find((line) => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  console.log("Setting default reactions for forum channels...\n");

  const guild = client.guilds.cache.first();
  const channels = guild.channels.cache;

  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [id, channel] of channels) {
    // Only process forum channels (type 15)
    if (channel.type !== 15) {
      continue;
    }

    try {
      await channel.edit({
        defaultReactionEmoji: { name: "👍" },
        reason: "Setting default reaction emoji for forum posts",
      });
      console.log(`✓ Updated ${channel.name}`);
      updated++;

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Failed to update ${channel.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  ✓ Updated: ${updated}`);
  console.log(`  ✗ Errors: ${errors}`);

  process.exit(0);
});

client.login(TOKEN);
