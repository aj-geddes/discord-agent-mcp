import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync, writeFileSync, existsSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find((line) => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function splitContent(content, maxLength = 1900) {
  const lines = content.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + line + "\n").length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = line.length > maxLength ? line.substring(0, maxLength - 3) + "..." : line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

// Forum to file mapping
const FORUM_FILES = {
  "foundations": "foundations-welcome.md",
  "deep-learning": "deep-learning-welcome.md",
  "machine-learning": "machine-learning-welcome.md",
  "mathematics-corner": "mathematics-corner-pinned.md",
  "paper-reading-club": "paper-reading-club-welcome.md",
  "computer-vision": "computer-vision-welcome.md",
  "natural-language-processing": "natural-language-processing-welcome.md",
  "llm-development": "llm-development-welcome.md",
  "reinforcement-learning": "reinforcement-learning-welcome.md",
  "code-review": "code-review-welcome.md",
  "project-showcase": "project-showcase-welcome.md",
  "research-discussions": "research-discussions-welcome.md",
  "beginner-bootcamp": "beginner-bootcamp-welcome.md",
  "intermediate-workshops": "intermediate-workshops-welcome.md",
  "advanced-seminars": "advanced-seminars-welcome.md",
  "career-guidance": "career-guidance-welcome.md",
  "book-club": "book-club-welcome.md",
  "weekly-challenges": "weekly-challenges-welcome.md",
  "collaboration-board": "collaboration-board-welcome.md",
  "feedback-suggestions": "feedback-suggestions-welcome.md",
};

async function updateForumThread(forumName, options = {}) {
  const fileName = FORUM_FILES[forumName];

  if (!fileName) {
    console.error(`❌ Unknown forum: ${forumName}`);
    return false;
  }

  const filePath = `content/${fileName}`;

  if (!existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    return false;
  }

  try {
    const guild = client.guilds.cache.first();
    const forum = guild.channels.cache.find(c => c.name === forumName && c.type === 15);

    if (!forum) {
      console.error(`❌ Forum channel not found: ${forumName}`);
      return false;
    }

    // Find the "START HERE" thread
    const threads = await forum.threads.fetchActive();
    const targetThread = threads.threads.find(t => t.name.includes("START HERE"));

    if (!targetThread) {
      console.error(`❌ Could not find "START HERE" thread in ${forumName}`);
      console.log("💡 Available threads:");
      threads.threads.forEach(t => console.log(`   - ${t.name}`));
      return false;
    }

    console.log(`✓ Found thread: ${targetThread.name}`);
    console.log(`  Thread ID: ${targetThread.id}`);
    console.log();

    const content = readFileSync(filePath, "utf8");
    const chunks = splitContent(content);

    // Fetch existing messages
    console.log("📥 Fetching existing messages...");
    const messages = await targetThread.messages.fetch({ limit: 100 });
    const existingMessages = Array.from(messages.values()).reverse();

    console.log(`  Current messages: ${existingMessages.length}`);
    console.log(`  New content chunks: ${chunks.length}`);
    console.log();

    if (options.mode === "append") {
      // Add update notification at the end
      const updateMessage = `\n\n---\n\n**🔄 Content Updated: ${new Date().toLocaleDateString()}**\n\n${options.message || "Latest resources, papers, and tools have been added."}`;
      await targetThread.send(updateMessage);
      console.log("✓ Added update notification");
      return true;
    }

    // Default: Replace all messages
    console.log("🔄 Updating thread content...");
    console.log("⚠️  This will edit all existing messages");
    console.log();

    if (options.dryRun) {
      console.log("✅ Dry run complete - no changes made");
      console.log(`\nWould update ${Math.min(existingMessages.length, chunks.length)} messages`);
      if (chunks.length > existingMessages.length) {
        console.log(`Would add ${chunks.length - existingMessages.length} new messages`);
      }
      return true;
    }

    // Update existing messages
    for (let i = 0; i < Math.min(existingMessages.length, chunks.length); i++) {
      try {
        await existingMessages[i].edit(chunks[i]);
        console.log(`✓ Updated message ${i + 1}/${chunks.length}`);
        await delay(1500);
      } catch (error) {
        console.error(`✗ Failed to update message ${i + 1}: ${error.message}`);
      }
    }

    // Add new messages if content grew
    if (chunks.length > existingMessages.length) {
      console.log(`\n📝 Adding ${chunks.length - existingMessages.length} new messages...`);
      for (let i = existingMessages.length; i < chunks.length; i++) {
        try {
          await targetThread.send(chunks[i]);
          console.log(`✓ Added message ${i + 1}/${chunks.length}`);
          await delay(1500);
        } catch (error) {
          console.error(`✗ Failed to add message ${i + 1}: ${error.message}`);
        }
      }
    }

    // Delete excess messages if content shrunk
    if (existingMessages.length > chunks.length) {
      console.log(`\n🗑️  Removing ${existingMessages.length - chunks.length} excess messages...`);
      for (let i = chunks.length; i < existingMessages.length; i++) {
        try {
          await existingMessages[i].delete();
          console.log(`✓ Deleted message ${i + 1}`);
          await delay(1500);
        } catch (error) {
          console.error(`✗ Failed to delete message ${i + 1}: ${error.message}`);
        }
      }
    }

    console.log("\n✅ Thread updated successfully!");

    // Log the update
    const updateDetails = {
      date: new Date().toISOString(),
      messagesUpdated: Math.min(existingMessages.length, chunks.length),
      messagesAdded: Math.max(0, chunks.length - existingMessages.length),
      messagesRemoved: Math.max(0, existingMessages.length - chunks.length),
    };
    logUpdate(forumName, updateDetails);

    // Send Discord notification
    if (!options.dryRun) {
      await sendNotification(forumName, options.mode || "replace", true, updateDetails);
    }

    return true;
  } catch (error) {
    console.error(`❌ Error updating thread: ${error.message}`);
    return false;
  }
}

async function sendNotification(forumName, mode, success, details = {}) {
  try {
    // Find mod-content channel
    const guild = client.guilds.cache.first();
    const modContentChannel = guild.channels.cache.find(c => c.name === "mod-content");

    if (!modContentChannel) {
      console.warn("⚠️  mod-content channel not found - notification skipped");
      return;
    }

    const { EmbedBuilder } = await import("discord.js");
    const embed = new EmbedBuilder()
      .setTitle(`📡 Discord Sync: ${forumName}`)
      .setColor(success ? 0x00ff00 : 0xff0000)
      .setTimestamp();

    if (success) {
      embed.setDescription(`✅ Successfully synced content to Discord forum`);
      embed.addFields({
        name: "🔄 Mode",
        value: mode === "append" ? "Append (added update note)" : "Replace (updated all messages)",
        inline: true,
      });

      if (details.messagesUpdated || details.messagesAdded) {
        const changes = [];
        if (details.messagesUpdated) changes.push(`Updated: ${details.messagesUpdated}`);
        if (details.messagesAdded) changes.push(`Added: ${details.messagesAdded}`);
        if (details.messagesRemoved) changes.push(`Removed: ${details.messagesRemoved}`);

        embed.addFields({
          name: "📊 Changes",
          value: changes.join("\n"),
          inline: true,
        });
      }
    } else {
      embed.setDescription(`❌ Failed to sync content`);
      if (details.error) {
        embed.addFields({
          name: "⚠️ Error",
          value: details.error,
          inline: false,
        });
      }
    }

    await modContentChannel.send({ embeds: [embed] });
    console.log("✅ Notification sent to #mod-content");
  } catch (error) {
    console.warn(`⚠️  Failed to send notification: ${error.message}`);
  }
}

function logUpdate(forumName, details) {
  const logFile = "content-maintenance/history/update-log.json";

  let log = [];
  if (existsSync(logFile)) {
    log = JSON.parse(readFileSync(logFile, "utf8"));
  }

  log.push({
    forum: forumName,
    ...details,
  });

  writeFileSync(logFile, JSON.stringify(log, null, 2));
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  const forumArg = args.find(arg => arg.startsWith("--forum="));
  const forumName = forumArg?.split("=")[1];

  const options = {
    dryRun: args.includes("--dry-run"),
    mode: args.find(arg => arg.startsWith("--mode="))?.split("=")[1] || "replace",
    message: args.find(arg => arg.startsWith("--message="))?.split("=")[1],
  };

  if (!forumName) {
    console.error("❌ Error: --forum=<name> is required");
    console.log("\nUsage: node scripts/update-forum-thread.js --forum=<name> [options]");
    console.log("\nOptions:");
    console.log("  --dry-run          Preview changes without applying");
    console.log("  --mode=<replace|append>  Update mode (default: replace)");
    console.log("  --message=<text>   Custom update message (for append mode)");
    console.log("\nAvailable forums:");
    Object.keys(FORUM_FILES).forEach(f => console.log(`  - ${f}`));
    process.exit(1);
  }

  client.once("ready", async () => {
    console.log(`🤖 Connected as ${client.user.tag}\n`);
    console.log(`📝 Updating forum: ${forumName}`);
    console.log(`Mode: ${options.mode}${options.dryRun ? " (DRY RUN)" : ""}\n`);

    const success = await updateForumThread(forumName, options);

    process.exit(success ? 0 : 1);
  });

  client.login(TOKEN);
}
