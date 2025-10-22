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

// Split content into chunks
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

      // If single line is too long, split it
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
  const foundationsForum = guild.channels.cache.find(
    (c) => c.name === "foundations" && c.type === 15 // Forum type
  );

  if (!foundationsForum) {
    console.error("✗ Could not find foundations forum!");
    process.exit(1);
  }

  console.log(`Found forum: ${foundationsForum.name} (${foundationsForum.id})\n`);

  // Read the content
  const content = readFileSync("content/foundations-welcome.md", "utf8");
  const chunks = splitContent(content);

  console.log(`Content split into ${chunks.length} messages\n`);

  try {
    // Create the forum thread
    console.log("Creating forum thread...");
    const thread = await foundationsForum.threads.create({
      name: "📚 START HERE: Foundations Learning Guide & Resources",
      message: {
        content: chunks[0],
      },
    });

    console.log(`✓ Thread created: ${thread.id}\n`);

    // Post remaining chunks
    for (let i = 1; i < chunks.length; i++) {
      console.log(`Posting chunk ${i + 1}/${chunks.length}...`);
      await delay(1500); // Rate limiting
      await thread.send(chunks[i]);
    }

    // Pin the thread
    console.log("\nPinning thread...");
    await thread.setPin(true);

    console.log("\n✓ Foundations welcome guide posted and pinned!");
    console.log(`\nThread URL: https://discord.com/channels/${guild.id}/${thread.id}`);

  } catch (error) {
    console.error("✗ Error posting content:", error.message);
  }

  process.exit(0);
});

client.login(TOKEN);
