import { Client, GatewayIntentBits } from "discord.js";
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
  console.log("Setting admin-only permissions...\n");

  const guild = client.guilds.cache.first();
  const guildId = guild.id;

  // Find channels
  const theForum = guild.channels.cache.find((c) => c.name === "the-forum");
  const general = guild.channels.cache.find(
    (c) => c.name === "general" && c.parentId === guild.channels.cache.find(cat => cat.name === "Text Channels")?.id
  );

  // Find Architect role
  const architectRole = guild.roles.cache.find((r) => r.name === "Architect");
  const everyoneRole = guild.roles.everyone;

  console.log(`Guild: ${guild.name} (${guildId})`);
  console.log(`the-forum: ${theForum?.id}`);
  console.log(`general: ${general?.id}`);
  console.log(`Architect role: ${architectRole?.id}`);
  console.log(`@everyone role: ${everyoneRole?.id}\n`);

  // Set permissions for the-forum
  if (theForum) {
    try {
      console.log("Setting permissions for the-forum...");

      // Deny @everyone
      await callMcpTool("set_channel_permissions", {
        channelId: theForum.id,
        targetId: everyoneRole.id,
        targetType: "role",
        deny: ["ViewChannel"],
      });
      console.log("  ✓ Denied @everyone ViewChannel");

      // Allow Architect
      await callMcpTool("set_channel_permissions", {
        channelId: theForum.id,
        targetId: architectRole.id,
        targetType: "role",
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      });
      console.log("  ✓ Allowed Architect full access\n");
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}\n`);
    }
  }

  // Set permissions for general
  if (general) {
    try {
      console.log("Setting permissions for general...");

      // Deny @everyone
      await callMcpTool("set_channel_permissions", {
        channelId: general.id,
        targetId: everyoneRole.id,
        targetType: "role",
        deny: ["ViewChannel"],
      });
      console.log("  ✓ Denied @everyone ViewChannel");

      // Allow Architect
      await callMcpTool("set_channel_permissions", {
        channelId: general.id,
        targetId: architectRole.id,
        targetType: "role",
        allow: ["ViewChannel", "SendMessages", "ReadMessageHistory"],
      });
      console.log("  ✓ Allowed Architect full access\n");
    } catch (error) {
      console.log(`  ✗ Failed: ${error.message}\n`);
    }
  }

  console.log("✓ Admin channels configured!");
  process.exit(0);
});

client.login(TOKEN);
