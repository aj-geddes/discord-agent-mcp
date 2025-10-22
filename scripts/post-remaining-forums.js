import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find(line => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Get current date formatted nicely
function getFormattedDate() {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Get current time formatted nicely
function getFormattedTime() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// Extract section by name from markdown
function extractSectionByName(content, sectionName) {
  const lines = content.split("\n");
  const sectionStart = lines.findIndex(line => line.trim() === `## ${sectionName}`);

  if (sectionStart === -1) return "";

  let sectionEnd = lines.length;
  for (let i = sectionStart + 1; i < lines.length; i++) {
    if (lines[i].match(/^## [A-Z]/)) { // Next major section
      sectionEnd = i;
      break;
    }
  }

  return lines.slice(sectionStart, sectionEnd).join("\n").trim();
}

// Split content into chunks that fit Discord's limits
function splitContent(content, maxLength = 4000) {
  if (content.length <= maxLength) {
    return [content];
  }

  const chunks = [];
  const paragraphs = content.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function postUpdate(guild, forumName, content, title) {
  try {
    const forum = guild.channels.cache.find(c => c.name === forumName && c.type === 15);

    if (!forum) {
      console.log(`⚠️  Forum not found: ${forumName}`);
      return false;
    }

    // Find or create Updates thread
    const threads = await forum.threads.fetchActive();
    let updateThread = threads.threads.find(t => t.name.includes("Updates") || t.name.includes("2025"));

    if (!updateThread) {
      updateThread = await forum.threads.create({
        name: `📅 ${new Date().getFullYear()} Updates & New Content`,
        message: { content: `Weekly updates with new resources, papers, tools, and developments.` },
      });
      await delay(1000);
    }

    // Add date and time to title
    const dateStr = getFormattedDate();
    const timeStr = getFormattedTime();
    const fullTitle = `☀️ ${title} - ${dateStr} at ${timeStr}`;

    // Split content if too long
    const contentChunks = splitContent(content, 3800); // Leave room for formatting

    // Post first chunk with full title
    const firstEmbed = new EmbedBuilder()
      .setTitle(fullTitle)
      .setDescription(contentChunks[0])
      .setColor(0xffa500)
      .setTimestamp()
      .setFooter({ text: `${forumName} • Morning Update` });

    await updateThread.send({ embeds: [firstEmbed] });
    await delay(1500);

    // Post additional chunks if needed
    for (let i = 1; i < contentChunks.length; i++) {
      const continueEmbed = new EmbedBuilder()
        .setTitle(`${title} (continued - part ${i + 1})`)
        .setDescription(contentChunks[i])
        .setColor(0xffa500)
        .setTimestamp();

      await updateThread.send({ embeds: [continueEmbed] });
      await delay(1500);
    }

    console.log(`✅ Posted to ${forumName} (${contentChunks.length} part${contentChunks.length > 1 ? 's' : ''})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to post to ${forumName}: ${error.message}`);
    return false;
  }
}

async function postToTextChannel(guild, channelName, content, title) {
  try {
    const textChannel = guild.channels.cache.find(c => c.name === channelName && c.type === 0);

    if (!textChannel) {
      console.log(`⚠️  Text channel '${channelName}' not found`);
      return false;
    }

    const dateStr = getFormattedDate();
    const timeStr = getFormattedTime();
    const fullTitle = `☀️ ${title} - ${dateStr} at ${timeStr}`;

    const contentChunks = splitContent(content, 1800); // Text messages have lower limits

    for (let i = 0; i < contentChunks.length; i++) {
      const header = i === 0 ? `**${fullTitle}**\n\n` : `**(continued - part ${i + 1})**\n\n`;
      await textChannel.send(header + contentChunks[i]);
      await delay(1500);
    }

    console.log(`✅ Posted to ${channelName} (text channel, ${contentChunks.length} part${contentChunks.length > 1 ? 's' : ''})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to post to ${channelName}: ${error.message}`);
    return false;
  }
}

async function notifyModContent(guild, stats) {
  try {
    const modChannel = guild.channels.cache.find(c => c.name === "mod-content");
    if (!modChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("☀️ Remaining Morning Updates Posted (with Dates & Links)")
      .setColor(0x00ff00)
      .setTimestamp()
      .addFields(
        { name: "📊 Summary", value: `Posted updates to ${stats.successful}/${stats.total} remaining forums with proper dates and preserved links` },
        { name: "✅ Successful", value: stats.successful.toString(), inline: true },
        { name: "❌ Failed", value: stats.failed.toString(), inline: true }
      );

    if (stats.failedForums.length > 0) {
      embed.addFields({
        name: "⚠️ Failed Forums",
        value: stats.failedForums.join(", "),
      });
    }

    await modChannel.send({ embeds: [embed] });
    console.log("✅ Notified #mod-content");
  } catch (error) {
    console.warn(`⚠️  Failed to notify mod-content: ${error.message}`);
  }
}

client.once("ready", async () => {
  console.log("🤖 Connected - Posting remaining morning updates...\n");
  console.log(`📅 Date: ${getFormattedDate()}`);
  console.log(`⏰ Time: ${getFormattedTime()}\n`);

  const guild = client.guilds.cache.first();
  const stats = { total: 0, successful: 0, failed: 0, failedForums: [] };

  // Read update files
  const research = readFileSync("updates/research-am.md", "utf8");
  const practical = readFileSync("updates/practical-am.md", "utf8");

  // Extract named sections and post
  const UPDATES = [
    {
      forum: "paper-reading-club",
      content: extractSectionByName(research, "Paper Reading Club Forum"),
      title: "Paper Reading Club Update"
    },
    {
      forum: "research-discussions",
      content: extractSectionByName(research, "Research Discussions Forum"),
      title: "Research Discussions Update"
    },
    {
      forum: "mathematics-corner",
      content: extractSectionByName(research, "Mathematics Corner"),
      title: "Mathematics Corner Update",
      isTextChannel: true
    },
    {
      forum: "code-review",
      content: extractSectionByName(practical, "Code Review Forum - New Code Quality Tools & Best Practices"),
      title: "Code Review Update"
    },
    {
      forum: "project-showcase",
      content: extractSectionByName(practical, "Project Showcase Forum - Trending ML Projects"),
      title: "Project Showcase Update"
    },
    {
      forum: "feedback-suggestions",
      content: extractSectionByName(practical, "Feedback & Suggestions Forum - Community Tools & Resources"),
      title: "Feedback & Suggestions Update"
    },
  ];

  for (const update of UPDATES) {
    if (update.content && update.content.trim().length > 100) {
      stats.total++;

      let success;
      if (update.isTextChannel) {
        success = await postToTextChannel(guild, update.forum, update.content, update.title);
      } else {
        success = await postUpdate(guild, update.forum, update.content, update.title);
      }

      if (success) stats.successful++;
      else { stats.failed++; stats.failedForums.push(update.forum); }

      await delay(2000);
    } else {
      console.log(`⚠️  Skipping ${update.forum} - content too short or not found (${update.content?.length || 0} chars)`);
    }
  }

  // Notify mod-content
  await notifyModContent(guild, stats);

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 POSTING REMAINING FORUMS COMPLETE");
  console.log(`${"=".repeat(50)}`);
  console.log(`✅ Successful: ${stats.successful}/${stats.total}`);
  console.log(`❌ Failed: ${stats.failed}/${stats.total}`);
  if (stats.failedForums.length > 0) {
    console.log(`Failed forums: ${stats.failedForums.join(", ")}`);
  }
  console.log(`${"=".repeat(50)}`);

  client.destroy();
  process.exit(0);
});

client.login(TOKEN);
