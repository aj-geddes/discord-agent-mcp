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

// Extract sections from combined files
function extractSection(content, sectionNumber) {
  const lines = content.split("\n");
  const sections = [];
  let currentSection = [];
  let inSection = false;

  for (const line of lines) {
    if (line.match(/^## \d+\./)) {
      if (currentSection.length > 0) {
        sections.push(currentSection.join("\n"));
      }
      currentSection = [line];
      inSection = true;
    } else if (inSection) {
      if (line.startsWith("---") && currentSection.length > 5) {
        currentSection.push(line);
        sections.push(currentSection.join("\n"));
        currentSection = [];
        inSection = false;
      } else {
        currentSection.push(line);
      }
    }
  }

  if (currentSection.length > 0) {
    sections.push(currentSection.join("\n"));
  }

  return sections[sectionNumber - 1] || "";
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

async function notifyModContent(guild, stats) {
  try {
    const modChannel = guild.channels.cache.find(c => c.name === "mod-content");
    if (!modChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("☀️ Morning Updates Re-Posted (with Dates & Links)")
      .setColor(0x00ff00)
      .setTimestamp()
      .addFields(
        { name: "📊 Summary", value: `Re-posted updates to ${stats.successful}/${stats.total} forums with proper dates and preserved links` },
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
  console.log("🤖 Connected - Re-posting morning updates with dates and links...\n");
  console.log(`📅 Date: ${getFormattedDate()}`);
  console.log(`⏰ Time: ${getFormattedTime()}\n`);

  const guild = client.guilds.cache.first();
  const stats = { total: 0, successful: 0, failed: 0, failedForums: [] };

  // Read all update files
  const learningResources = readFileSync("updates/learning-resources-am.md", "utf8");
  const research = readFileSync("updates/research-am.md", "utf8");
  const community = readFileSync("updates/community-am.md", "utf8");
  const practical = readFileSync("updates/practical-am.md", "utf8");

  // Forum updates with individual files
  const INDIVIDUAL_UPDATES = [
    { forum: "llm-development", file: "updates/llm-development-am.md", title: "LLM Morning Update" },
    { forum: "computer-vision", file: "updates/computer-vision-am.md", title: "Computer Vision Morning Update" },
    { forum: "natural-language-processing", file: "updates/natural-language-processing-am.md", title: "NLP Morning Update" },
    { forum: "reinforcement-learning", file: "updates/reinforcement-learning-am.md", title: "RL Morning Update" },
  ];

  // Post individual files
  for (const update of INDIVIDUAL_UPDATES) {
    stats.total++;
    const content = readFileSync(update.file, "utf8");
    const success = await postUpdate(guild, update.forum, content, update.title);
    if (success) stats.successful++;
    else { stats.failed++; stats.failedForums.push(update.forum); }
    await delay(2000);
  }

  // Post extracted sections from combined files
  const EXTRACTED_UPDATES = [
    { forum: "foundations", content: extractSection(learningResources, 1), title: "Foundations Learning Update" },
    { forum: "deep-learning", content: extractSection(learningResources, 2), title: "Deep Learning Update" },
    { forum: "machine-learning", content: extractSection(learningResources, 3), title: "Machine Learning Update" },
    { forum: "beginner-bootcamp", content: extractSection(learningResources, 4), title: "Beginner Bootcamp Update" },
    { forum: "intermediate-workshops", content: extractSection(learningResources, 5), title: "Intermediate Workshops Update" },
    { forum: "advanced-seminars", content: extractSection(learningResources, 6), title: "Advanced Seminars Update" },
    { forum: "paper-reading-club", content: extractSection(research, 1), title: "Paper Reading Club Update" },
    { forum: "research-discussions", content: extractSection(research, 2), title: "Research Discussions Update" },
    { forum: "mathematics-corner-text", content: extractSection(research, 3), title: "Mathematics Corner Update", isTextChannel: true },
    { forum: "career-guidance", content: extractSection(community, 1), title: "Career Guidance Update" },
    { forum: "book-club", content: extractSection(community, 2), title: "Book Club Update" },
    { forum: "weekly-challenges", content: extractSection(community, 3), title: "Weekly Challenges Update" },
    { forum: "collaboration-board", content: extractSection(community, 4), title: "Collaboration Board Update" },
    { forum: "code-review", content: extractSection(practical, 1), title: "Code Review Update" },
    { forum: "project-showcase", content: extractSection(practical, 2), title: "Project Showcase Update" },
    { forum: "feedback-suggestions", content: extractSection(practical, 3), title: "Feedback & Suggestions Update" },
  ];

  for (const update of EXTRACTED_UPDATES) {
    if (update.content && update.content.trim().length > 100) {
      stats.total++;

      // Handle mathematics-corner as text channel
      if (update.isTextChannel) {
        try {
          const textChannel = guild.channels.cache.find(c => c.name === "mathematics-corner" && c.type === 0);
          if (textChannel) {
            const dateStr = getFormattedDate();
            const timeStr = getFormattedTime();
            const fullTitle = `☀️ ${update.title} - ${dateStr} at ${timeStr}`;

            const contentChunks = splitContent(update.content, 1800); // Text messages have lower limits

            for (let i = 0; i < contentChunks.length; i++) {
              const header = i === 0 ? `**${fullTitle}**\n\n` : `**(continued - part ${i + 1})**\n\n`;
              await textChannel.send(header + contentChunks[i]);
              await delay(1500);
            }

            console.log(`✅ Posted to mathematics-corner (text channel, ${contentChunks.length} part${contentChunks.length > 1 ? 's' : ''})`);
            stats.successful++;
          } else {
            console.log(`⚠️  Text channel 'mathematics-corner' not found`);
            stats.failed++;
            stats.failedForums.push("mathematics-corner");
          }
        } catch (error) {
          console.error(`❌ Failed to post to mathematics-corner: ${error.message}`);
          stats.failed++;
          stats.failedForums.push("mathematics-corner");
        }
      } else {
        const success = await postUpdate(guild, update.forum, update.content, update.title);
        if (success) stats.successful++;
        else { stats.failed++; stats.failedForums.push(update.forum); }
      }

      await delay(2000);
    }
  }

  // Notify mod-content
  await notifyModContent(guild, stats);

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 RE-POSTING COMPLETE");
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
