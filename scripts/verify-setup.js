import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile
  .split("\n")
  .find((line) => line.startsWith("DISCORD_TOKEN="))
  ?.split("=")[1]
  .trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", async () => {
  console.log("\n" + "=".repeat(70));
  console.log("NEURAL NETWORK ACADEMY - SETUP VERIFICATION");
  console.log("=".repeat(70) + "\n");

  const guild = client.guilds.cache.first();

  // Verify Roles
  console.log("ROLES:");
  console.log("-".repeat(70));
  const roles = guild.roles.cache
    .filter((r) => r.name !== "@everyone")
    .sort((a, b) => b.position - a.position);

  roles.forEach((role) => {
    const color = role.color.toString(16).padStart(6, "0").toUpperCase();
    const hoistSymbol = role.hoist ? "📌" : "  ";
    const mentionableSymbol = role.mentionable ? "@" : " ";
    console.log(
      `${hoistSymbol} ${mentionableSymbol} #${color} ${role.name.padEnd(40)} (${role.members.size} members)`
    );
  });

  console.log(`\nTotal Roles: ${roles.size}`);

  // Verify Categories
  console.log("\n\nCATEGORIES & CHANNELS:");
  console.log("-".repeat(70));

  const categories = guild.channels.cache
    .filter((c) => c.type === 4) // Category type
    .sort((a, b) => a.position - b.position);

  categories.forEach((category) => {
    console.log(`\n📁 ${category.name}`);

    const channels = guild.channels.cache
      .filter((c) => c.parentId === category.id)
      .sort((a, b) => a.position - b.position);

    channels.forEach((channel) => {
      let icon = "  ";
      if (channel.type === 0) icon = "💬"; // Text
      if (channel.type === 2) icon = "🔊"; // Voice
      if (channel.type === 13) icon = "🎤"; // Stage
      if (channel.type === 15) icon = "📋"; // Forum

      let info = "";
      if (channel.topic) {
        info = ` - ${channel.topic.substring(0, 50)}${channel.topic.length > 50 ? "..." : ""}`;
      }
      if (channel.type === 15) {
        // Forum
        const tagCount = channel.availableTags ? channel.availableTags.length : 0;
        info = ` - ${tagCount} tags`;
      }
      if (channel.type === 2 || channel.type === 13) {
        // Voice/Stage
        info = ` - ${channel.bitrate || 64000} bps`;
        if (channel.userLimit) {
          info += `, max ${channel.userLimit} users`;
        }
      }

      console.log(`   ${icon} ${channel.name}${info}`);
    });
  });

  console.log("\n\n" + "=".repeat(70));
  console.log("SUMMARY:");
  console.log("=".repeat(70));
  console.log(`Roles: ${roles.size}`);
  console.log(`Categories: ${categories.size}`);
  console.log(`Total Channels: ${guild.channels.cache.filter((c) => c.type !== 4).size}`);
  console.log("\n✓ Neural Network Academy setup complete!\n");

  process.exit(0);
});

client.login(TOKEN);
