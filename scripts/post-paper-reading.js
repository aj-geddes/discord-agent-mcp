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

client.once("ready", async () => {
  const guild = client.guilds.cache.first();
  const forum = guild.channels.cache.find(c => c.name === "paper-reading-club" && c.type === 15);

  if (!forum) {
    console.error("Forum not found!");
    process.exit(1);
  }

  const content = readFileSync("content/paper-reading-club-welcome.md", "utf8");
  const chunks = splitContent(content);

  console.log(`Posting ${chunks.length} messages...`);

  const thread = await forum.threads.create({
    name: "📜 START HERE: Paper Reading Club Guide & Resources",
    message: { content: chunks[0] },
  });

  for (let i = 1; i < chunks.length; i++) {
    await delay(1500);
    await thread.send(chunks[i]);
    if (i % 5 === 0) console.log(`Posted ${i}/${chunks.length}`);
  }

  console.log(`✓ Done! ${chunks.length} messages posted`);
  process.exit(0);
});

client.login(TOKEN);
