import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile
  .split("\n")
  .find((line) => line.startsWith("DISCORD_TOKEN="))
  ?.split("=")[1]
  .trim();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function splitContent(content, maxLength = 1900) {
  const lines = content.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + line + "\n").length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }

      if (line.length > maxLength) {
        const words = line.split(" ");
        let tempLine = "";
        for (const word of words) {
          if ((tempLine + word + " ").length > maxLength) {
            chunks.push(tempLine.trim());
            tempLine = "";
          }
          tempLine += word + " ";
        }
        if (tempLine) currentChunk = tempLine;
      } else {
        currentChunk = line + "\n";
      }
    } else {
      currentChunk += line + "\n";
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

client.once("ready", async () => {
  console.log(`✓ Connected as ${client.user.tag}\n`);

  const guild = client.guilds.cache.first();
  const deepLearningForum = guild.channels.cache.find(
    (c) => c.name === "deep-learning" && c.type === 15
  );

  if (!deepLearningForum) {
    console.error("✗ Could not find deep-learning forum!");
    process.exit(1);
  }

  console.log(`Found forum: ${deepLearningForum.name} (${deepLearningForum.id})\n`);

  const content = readFileSync("content/deep-learning-welcome.md", "utf8");
  const chunks = splitContent(content);

  console.log(`Content split into ${chunks.length} messages\n`);

  try {
    console.log("Creating forum thread...");
    const thread = await deepLearningForum.threads.create({
      name: "🧠 START HERE: Deep Learning Guide & Resources",
      message: {
        content: chunks[0],
      },
    });

    console.log(`✓ Thread created: ${thread.id}\n`);

    for (let i = 1; i < chunks.length; i++) {
      console.log(`Posting chunk ${i + 1}/${chunks.length}...`);
      await delay(1500);
      await thread.send(chunks[i]);
    }

    console.log("\n✓ Deep Learning guide posted!");
    console.log(`Thread URL: https://discord.com/channels/${guild.id}/${thread.id}`);
  } catch (error) {
    console.error("✗ Error posting content:", error.message);
  }

  process.exit(0);
});

client.login(TOKEN);
