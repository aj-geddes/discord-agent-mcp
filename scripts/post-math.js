import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile.split("\n").find(line => line.startsWith("DISCORD_TOKEN="))?.split("=")[1].trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function splitContent(content, maxLength = 1900) {
  const lines = content.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (const line of lines) {
    if ((currentChunk + line + "\n").length > maxLength) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = line + "\n";
    } else {
      currentChunk += line + "\n";
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

client.once("ready", async () => {
  const guild = client.guilds.cache.first();
  const channel = guild.channels.cache.find(c => c.name === "mathematics-corner");

  if (!channel) {
    console.error("Channel not found!");
    process.exit(1);
  }

  const content = readFileSync("content/mathematics-corner-pinned.md", "utf8");
  const chunks = splitContent(content);

  console.log(`Posting ${chunks.length} messages to mathematics-corner...`);

  const messages = [];
  for (let i = 0; i < chunks.length; i++) {
    const msg = await channel.send(chunks[i]);
    messages.push(msg);
    if (i < chunks.length - 1) await delay(1500);
    if (i % 5 === 0) console.log(`Posted ${i + 1}/${chunks.length}`);
  }

  await messages[0].pin();
  console.log(`✓ Done! ${chunks.length} messages posted and first pinned`);
  process.exit(0);
});

client.login(TOKEN);
