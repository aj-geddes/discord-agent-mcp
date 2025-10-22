import { Client, GatewayIntentBits, ChannelType } from "discord.js";
import { readFileSync } from "fs";

const envFile = readFileSync(".env", "utf8");
const TOKEN = envFile
  .split("\n")
  .find((line) => line.startsWith("DISCORD_TOKEN="))
  ?.split("=")[1]
  .trim();

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

async function callMcpTool(toolName, args) {
  const response = await fetch("http://localhost:3001/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
      id: Date.now(),
    }),
  });

  const data = await response.json();
  if (data.error) {
    throw new Error(`MCP Error: ${JSON.stringify(data.error)}`);
  }
  return data.result;
}

client.once("ready", async () => {
  const guild = client.guilds.cache.first();
  const voiceCat = guild.channels.cache.find(
    (c) => c.name === "🗣️ VOICE CHANNELS"
  );

  console.log("Creating Workshop Stage channel directly via Discord.js...");
  try {
    const channel = await guild.channels.create({
      name: "🎤 Workshop Stage",
      type: ChannelType.GuildStageVoice,
      topic: "Live presentations and workshops",
      parent: voiceCat.id,
    });

    console.log(`✓ Created Workshop Stage successfully! (ID: ${channel.id})`);
  } catch (error) {
    console.error("✗ Failed:", error.message);
  }

  process.exit(0);
});

client.login(TOKEN);
