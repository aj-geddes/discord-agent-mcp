import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

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

const forums = [
  {
    name: "natural-language-processing",
    file: "content/natural-language-processing-welcome.md",
    threadTitle: "📝 START HERE: NLP Guide & Resources",
  },
  {
    name: "llm-development",
    file: "content/llm-development-welcome.md",
    threadTitle: "🤖 START HERE: LLM Development Guide & Resources",
  },
  {
    name: "reinforcement-learning",
    file: "content/reinforcement-learning-welcome.md",
    threadTitle: "🎮 START HERE: Reinforcement Learning Guide & Resources",
  },
  {
    name: "code-review",
    file: "content/code-review-welcome.md",
    threadTitle: "👨‍💻 START HERE: Code Review Guide & Best Practices",
  },
  {
    name: "project-showcase",
    file: "content/project-showcase-welcome.md",
    threadTitle: "🎨 START HERE: Project Showcase Guide",
  },
  {
    name: "research-discussions",
    file: "content/research-discussions-welcome.md",
    threadTitle: "🔬 START HERE: Research Discussions Guide",
  },
  {
    name: "beginner-bootcamp",
    file: "content/beginner-bootcamp-welcome.md",
    threadTitle: "🎓 START HERE: Beginner Bootcamp - 12 Week Program",
  },
  {
    name: "intermediate-workshops",
    file: "content/intermediate-workshops-welcome.md",
    threadTitle: "⚙️ START HERE: Intermediate Workshops Guide",
  },
  {
    name: "advanced-seminars",
    file: "content/advanced-seminars-welcome.md",
    threadTitle: "🧪 START HERE: Advanced Seminars Guide",
  },
  {
    name: "career-guidance",
    file: "content/career-guidance-welcome.md",
    threadTitle: "💼 START HERE: Career Guidance & Interview Prep",
  },
  {
    name: "book-club",
    file: "content/book-club-welcome.md",
    threadTitle: "📚 START HERE: Book Club Guide & Reading List",
  },
  {
    name: "weekly-challenges",
    file: "content/weekly-challenges-welcome.md",
    threadTitle: "🏆 START HERE: Weekly Challenges Guide",
  },
  {
    name: "collaboration-board",
    file: "content/collaboration-board-welcome.md",
    threadTitle: "🤝 START HERE: Collaboration Board Guide",
  },
  {
    name: "feedback-suggestions",
    file: "content/feedback-suggestions-welcome.md",
    threadTitle: "💡 START HERE: Feedback & Suggestions Guide",
  },
];

async function postToForum(guild, forumConfig) {
  const forum = guild.channels.cache.find(c => c.name === forumConfig.name && c.type === 15);

  if (!forum) {
    console.error(`❌ Forum "${forumConfig.name}" not found!`);
    return false;
  }

  try {
    const content = readFileSync(forumConfig.file, "utf8");
    const chunks = splitContent(content);

    console.log(`\n📝 Posting to ${forumConfig.name}...`);
    console.log(`   ${chunks.length} messages to post`);

    const thread = await forum.threads.create({
      name: forumConfig.threadTitle,
      message: { content: chunks[0] },
    });

    for (let i = 1; i < chunks.length; i++) {
      await delay(1500);
      await thread.send(chunks[i]);
      if (i % 5 === 0) {
        console.log(`   Progress: ${i}/${chunks.length}`);
      }
    }

    console.log(`✅ ${forumConfig.name}: ${chunks.length} messages posted`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to post to ${forumConfig.name}:`, error.message);
    return false;
  }
}

client.once("ready", async () => {
  console.log("🚀 Starting forum posting process...\n");
  console.log(`Total forums to process: ${forums.length}\n`);

  const guild = client.guilds.cache.first();

  let successful = 0;
  let failed = 0;

  for (const forumConfig of forums) {
    const success = await postToForum(guild, forumConfig);
    if (success) {
      successful++;
    } else {
      failed++;
    }

    // Delay between forums to avoid rate limiting
    await delay(3000);
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 FINAL SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successful}/${forums.length}`);
  console.log(`❌ Failed: ${failed}/${forums.length}`);
  console.log("=".repeat(50));

  process.exit(0);
});

client.login(TOKEN);
