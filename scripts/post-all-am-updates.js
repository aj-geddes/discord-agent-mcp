import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find(line => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Forum updates mapping
const UPDATES = [
  { forum: "llm-development", file: "updates/llm-development-am.md", title: "LLM Morning Update" },
  { forum: "computer-vision", file: "updates/computer-vision-am.md", title: "Computer Vision Morning Update" },
  { forum: "natural-language-processing", file: "updates/natural-language-processing-am.md", title: "NLP Morning Update" },
  { forum: "reinforcement-learning", file: "updates/reinforcement-learning-am.md", title: "RL Morning Update" },
];

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

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(`☀️ ${title}`)
      .setDescription(content.substring(0, 4000))
      .setColor(0xffa500)
      .setTimestamp()
      .setFooter({ text: `${forumName} • ${new Date().toLocaleDateString()}` });

    await updateThread.send({ embeds: [embed] });
    console.log(`✅ Posted to ${forumName}`);

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
      .setTitle("☀️ Morning Updates Posted")
      .setColor(0x00ff00)
      .setTimestamp()
      .addFields(
        { name: "📊 Summary", value: `Posted updates to ${stats.successful}/${stats.total} forums` },
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
  console.log("🤖 Connected - Posting morning updates...\n");

  const guild = client.guilds.cache.first();
  const stats = { total: 0, successful: 0, failed: 0, failedForums: [] };

  // Split combined files
  const learningResources = existsSync("updates/learning-resources-am.md")
    ? readFileSync("updates/learning-resources-am.md", "utf8")
    : "";
  const research = existsSync("updates/research-am.md")
    ? readFileSync("updates/research-am.md", "utf8")
    : "";
  const community = existsSync("updates/community-am.md")
    ? readFileSync("updates/community-am.md", "utf8")
    : "";
  const practical = existsSync("updates/practical-am.md")
    ? readFileSync("updates/practical-am.md", "utf8")
    : "";

  // Post individual files
  for (const update of UPDATES) {
    if (existsSync(update.file)) {
      stats.total++;
      const content = readFileSync(update.file, "utf8");
      const success = await postUpdate(guild, update.forum, content, update.title);
      if (success) stats.successful++;
      else { stats.failed++; stats.failedForums.push(update.forum); }
      await delay(2000);
    }
  }

  // Post extracted sections
  const extraUpdates = [
    { forum: "foundations", content: extractSection(learningResources, 1), title: "Foundations Learning Update" },
    { forum: "deep-learning", content: extractSection(learningResources, 2), title: "Deep Learning Update" },
    { forum: "machine-learning", content: extractSection(learningResources, 3), title: "Machine Learning Update" },
    { forum: "beginner-bootcamp", content: extractSection(learningResources, 4), title: "Beginner Bootcamp Update" },
    { forum: "intermediate-workshops", content: extractSection(learningResources, 5), title: "Intermediate Workshops Update" },
    { forum: "advanced-seminars", content: extractSection(learningResources, 6), title: "Advanced Seminars Update" },
    { forum: "paper-reading-club", content: extractSection(research, 1), title: "Paper Reading Club Update" },
    { forum: "research-discussions", content: extractSection(research, 2), title: "Research Discussions Update" },
    { forum: "mathematics-corner", content: extractSection(research, 3), title: "Mathematics Corner Update" },
    { forum: "career-guidance", content: extractSection(community, 1), title: "Career Guidance Update" },
    { forum: "book-club", content: extractSection(community, 2), title: "Book Club Update" },
    { forum: "weekly-challenges", content: extractSection(community, 3), title: "Weekly Challenges Update" },
    { forum: "collaboration-board", content: extractSection(community, 4), title: "Collaboration Board Update" },
    { forum: "code-review", content: extractSection(practical, 1), title: "Code Review Update" },
    { forum: "project-showcase", content: extractSection(practical, 2), title: "Project Showcase Update" },
    { forum: "feedback-suggestions", content: extractSection(practical, 3), title: "Feedback & Suggestions Update" },
  ];

  for (const update of extraUpdates) {
    if (update.content && update.content.trim().length > 100) {
      stats.total++;
      const success = await postUpdate(guild, update.forum, update.content, update.title);
      if (success) stats.successful++;
      else { stats.failed++; stats.failedForums.push(update.forum); }
      await delay(2000);
    }
  }

  // Notify mod-content
  await notifyModContent(guild, stats);

  console.log(`\n${"=".repeat(50)}`);
  console.log("📊 POSTING COMPLETE");
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
