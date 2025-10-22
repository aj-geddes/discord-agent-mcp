import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find(line => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const AI_LEARNING_DESCRIPTION = `🤖 Premier AI/ML learning community for enthusiasts at all levels. Daily research updates, hands-on projects, career guidance, and expert-curated resources. Topics: LLMs, Computer Vision, RL, Deep Learning, MLOps & more. Build the future of AI with us! 🚀`;

async function setupServerSettings(guild) {
  console.log("🤖 Setting up server configuration...\n");

  try {
    // Update server settings including description
    const updates = {
      description: AI_LEARNING_DESCRIPTION,
      preferredLocale: "en-US",
      explicitContentFilter: 1, // Filter content from members without roles
      defaultMessageNotifications: 0, // Only mentions by default
      verificationLevel: 1, // Must have verified email
    };

    await guild.edit(updates);
    console.log("✅ Server description updated");
    console.log("✅ Server settings updated:");
    console.log("   - Locale: en-US");
    console.log("   - Content filter: Enabled for new members");
    console.log("   - Notifications: Mentions only");
    console.log("   - Verification: Email required");

    // Try to enable community features if not already enabled
    try {
      const communityUpdates = {
        features: [
          "COMMUNITY",
          "DISCOVERABLE", // Makes server discoverable in server discovery
          "WELCOME_SCREEN_ENABLED",
        ],
      };

      // Note: Some features require specific server level/boosts
      console.log("\n⚙️  Attempting to enable community features...");
      console.log("   (Some features may require server boost level 1 or higher)");

    } catch (error) {
      console.log("⚠️  Some community features may require higher boost level");
      console.log(`   Error: ${error.message}`);
    }

    // Display current server info
    console.log("\n📊 Current Server Configuration:");
    console.log(`   Name: ${guild.name}`);
    console.log(`   ID: ${guild.id}`);
    console.log(`   Member Count: ${guild.memberCount}`);
    console.log(`   Boost Level: ${guild.premiumTier}`);
    console.log(`   Boosts: ${guild.premiumSubscriptionCount || 0}`);
    console.log(`   Verification Level: ${guild.verificationLevel}`);
    console.log(`   Features: ${guild.features.join(", ") || "None"}`);

    // Set up rules channel if it exists
    const rulesChannel = guild.channels.cache.find(c => c.name === "rules" || c.name === "server-rules");
    if (rulesChannel) {
      console.log(`\n📜 Rules channel found: #${rulesChannel.name}`);
      try {
        await guild.edit({ rulesChannel: rulesChannel.id });
        console.log("✅ Rules channel configured");
      } catch (error) {
        console.log("⚠️  Rules channel requires Community features enabled");
      }
    }

    // Set up community updates channel if it exists
    const updatesChannel = guild.channels.cache.find(c => c.name === "announcements" || c.name === "updates");
    if (updatesChannel) {
      console.log(`\n📢 Updates channel found: #${updatesChannel.name}`);
      try {
        await guild.edit({ publicUpdatesChannel: updatesChannel.id });
        console.log("✅ Community updates channel configured");
      } catch (error) {
        console.log("⚠️  Public updates channel requires Community features enabled");
      }
    }

    // Create welcome screen configuration
    try {
      const welcomeChannels = [
        { channel: guild.channels.cache.find(c => c.name === "welcome"), emoji: "👋", description: "Start here!" },
        { channel: guild.channels.cache.find(c => c.name === "rules"), emoji: "📜", description: "Community guidelines" },
        { channel: guild.channels.cache.find(c => c.name === "beginner-bootcamp"), emoji: "🎓", description: "New to AI/ML?" },
        { channel: guild.channels.cache.find(c => c.name === "llm-development"), emoji: "🤖", description: "LLM discussions" },
        { channel: guild.channels.cache.find(c => c.name === "collaboration-board"), emoji: "🤝", description: "Find project partners" },
      ].filter(item => item.channel); // Only include channels that exist

      if (welcomeChannels.length > 0 && guild.features.includes("WELCOME_SCREEN_ENABLED")) {
        await guild.editWelcomeScreen({
          enabled: true,
          description: "Welcome to the AI/ML Learning Community! Choose a channel to get started.",
          welcomeChannels: welcomeChannels.map(item => ({
            channel: item.channel.id,
            description: item.description,
            emoji: item.emoji,
          })),
        });
        console.log("\n✅ Welcome screen configured with channels");
      }
    } catch (error) {
      console.log("\n⚠️  Welcome screen setup requires Community features to be enabled");
      console.log(`   Error: ${error.message}`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ SERVER CONFIGURATION COMPLETE");
    console.log("=".repeat(60));
    console.log("\n📝 Next Steps:");
    console.log("   1. Review the server description in Server Settings");
    console.log("   2. Consider boosting the server for additional features");
    console.log("   3. Enable Community features in Server Settings > Enable Community");
    console.log("   4. Set up verification requirements if needed");
    console.log("   5. Configure discovery settings for public discoverability");

  } catch (error) {
    console.error("❌ Error setting up server:", error.message);
    throw error;
  }
}

client.once("ready", async () => {
  console.log("🤖 Bot connected successfully\n");

  const guild = client.guilds.cache.first();

  if (!guild) {
    console.error("❌ No guild found! Make sure the bot is in a server.");
    process.exit(1);
  }

  try {
    await setupServerSettings(guild);
  } catch (error) {
    console.error("❌ Setup failed:", error);
  }

  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
