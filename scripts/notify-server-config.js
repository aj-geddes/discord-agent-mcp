import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find(line => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once("ready", async () => {
  console.log("🤖 Connected - Sending server configuration notification...\n");

  const guild = client.guilds.cache.first();
  const modChannel = guild.channels.cache.find(c => c.name === "mod-content");

  if (!modChannel) {
    console.log("⚠️  #mod-content channel not found");
    client.destroy();
    process.exit(1);
  }

  const embed = new EmbedBuilder()
    .setTitle("⚙️ Server Configuration Updated")
    .setDescription("Discord server has been configured as an AI/ML Learning Community")
    .setColor(0x5865F2) // Discord Blurple
    .setTimestamp()
    .addFields(
      {
        name: "📝 Description Set",
        value: "🤖 Premier AI/ML learning community for enthusiasts at all levels. Daily research updates, hands-on projects, career guidance, and expert-curated resources.",
        inline: false
      },
      {
        name: "🌍 Server Settings",
        value: "• Locale: en-US\n• Verification: Email required\n• Content Filter: Active\n• Notifications: Mentions only",
        inline: true
      },
      {
        name: "📊 Current Status",
        value: `• Members: ${guild.memberCount}\n• Forums: 20\n• Boost Level: ${guild.premiumTier}\n• Features: ${guild.features.length}`,
        inline: true
      },
      {
        name: "✅ Completed Actions",
        value: "• Server description updated\n• Verification level set\n• Content filtering enabled\n• Notification preferences configured\n• Documentation created",
        inline: false
      },
      {
        name: "📋 Recommended Next Steps",
        value: "• Enable Community features\n• Set up Server Discovery\n• Configure Welcome Screen\n• Set up AutoMod rules\n• Consider server boosting",
        inline: false
      }
    )
    .setFooter({ text: "Server Configuration System" });

  await modChannel.send({ embeds: [embed] });
  console.log("✅ Notification sent to #mod-content");

  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
