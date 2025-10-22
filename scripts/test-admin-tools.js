import { Client, GatewayIntentBits } from "discord.js";
import { readFileSync } from "fs";

// Load .env manually
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
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

// MCP client helper
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
  console.log(`✓ Connected as ${client.user.tag}\n`);

  const guild = client.guilds.cache.first();
  const guildId = guild.id;

  const testResults = [];

  // Test 1: List Channels
  console.log("1. Testing list_channels...");
  try {
    const result = await callMcpTool("list_channels", {
      guildId,
      type: "all",
    });
    const count = result.structuredContent?.totalCount || 0;
    console.log(`   ✓ Found ${count} channels\n`);
    testResults.push({ tool: "list_channels", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "list_channels", status: "FAIL", error: error.message });
  }

  // Test 2: Get Audit Logs
  console.log("2. Testing get_audit_logs...");
  try {
    const result = await callMcpTool("get_audit_logs", {
      guildId,
      limit: 10,
      actionType: "ALL",
    });
    const count = result.structuredContent?.totalEntries || 0;
    console.log(`   ✓ Retrieved ${count} audit log entries\n`);
    testResults.push({ tool: "get_audit_logs", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "get_audit_logs", status: "FAIL", error: error.message });
  }

  // Test 3: List Webhooks
  console.log("3. Testing list_webhooks...");
  try {
    const result = await callMcpTool("list_webhooks", {
      guildId,
    });
    const count = result.structuredContent?.totalCount || 0;
    console.log(`   ✓ Found ${count} webhooks\n`);
    testResults.push({ tool: "list_webhooks", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "list_webhooks", status: "FAIL", error: error.message });
  }

  // Test 4: Get Invites
  console.log("4. Testing get_invites...");
  try {
    const result = await callMcpTool("get_invites", {
      guildId,
    });
    const count = result.structuredContent?.totalCount || 0;
    console.log(`   ✓ Found ${count} invites\n`);
    testResults.push({ tool: "get_invites", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "get_invites", status: "FAIL", error: error.message });
  }

  // Test 5: Get Bans
  console.log("5. Testing get_bans...");
  try {
    const result = await callMcpTool("get_bans", {
      guildId,
      limit: 100,
    });
    const count = result.structuredContent?.totalCount || 0;
    console.log(`   ✓ Found ${count} banned users\n`);
    testResults.push({ tool: "get_bans", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "get_bans", status: "FAIL", error: error.message });
  }

  // Test 6: Create Category
  console.log("6. Testing create_category...");
  try {
    const result = await callMcpTool("create_category", {
      guildId,
      name: "Test Admin Category",
    });
    const categoryId = result.structuredContent?.category?.id;
    console.log(`   ✓ Created category (ID: ${categoryId})\n`);
    testResults.push({ tool: "create_category", status: "PASS", categoryId });

    // Clean up - delete the category
    const category = await guild.channels.fetch(categoryId);
    if (category) {
      await category.delete("Test cleanup");
      console.log(`   ✓ Cleaned up test category\n`);
    }
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "create_category", status: "FAIL", error: error.message });
  }

  // Test 7: Create Voice Channel
  console.log("7. Testing create_voice_channel...");
  try {
    const result = await callMcpTool("create_voice_channel", {
      guildId,
      name: "Test Voice Channel",
      userLimit: 10,
    });
    const channelId = result.structuredContent?.channel?.id;
    console.log(`   ✓ Created voice channel (ID: ${channelId})\n`);
    testResults.push({ tool: "create_voice_channel", status: "PASS", channelId });

    // Clean up - delete the channel
    const channel = await guild.channels.fetch(channelId);
    if (channel) {
      await channel.delete("Test cleanup");
      console.log(`   ✓ Cleaned up test voice channel\n`);
    }
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "create_voice_channel", status: "FAIL", error: error.message });
  }

  // Test 8: Create Forum Channel
  console.log("8. Testing create_forum_channel...");
  try {
    const result = await callMcpTool("create_forum_channel", {
      guildId,
      name: "Test Forum",
      topic: "Test forum for admin tools",
    });
    const forumId = result.structuredContent?.forum?.id;
    console.log(`   ✓ Created forum channel (ID: ${forumId})\n`);
    testResults.push({ tool: "create_forum_channel", status: "PASS", forumId });

    // Clean up - delete the forum
    const forum = await guild.channels.fetch(forumId);
    if (forum) {
      await forum.delete("Test cleanup");
      console.log(`   ✓ Cleaned up test forum\n`);
    }
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "create_forum_channel", status: "FAIL", error: error.message });
  }

  // Test 9: Create and Archive Thread
  console.log("9. Testing create_thread and archive_thread...");
  try {
    // Find a text channel
    const textChannel = guild.channels.cache.find(
      (c) => c.type === 0 && c.name === "general"
    );

    if (!textChannel) {
      throw new Error("No text channel found for testing");
    }

    // Create thread
    const createResult = await callMcpTool("create_thread", {
      channelId: textChannel.id,
      name: "Test Admin Thread",
      message: "This is a test thread for admin tools",
      autoArchiveDuration: "60",
    });
    const threadId = createResult.structuredContent?.thread?.id;
    console.log(`   ✓ Created thread (ID: ${threadId})`);
    testResults.push({ tool: "create_thread", status: "PASS", threadId });

    // Archive thread
    const archiveResult = await callMcpTool("archive_thread", {
      threadId,
      locked: true,
    });
    console.log(`   ✓ Archived and locked thread\n`);
    testResults.push({ tool: "archive_thread", status: "PASS" });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "create_thread/archive_thread", status: "FAIL", error: error.message });
  }

  // Test 10: Modify Channel
  console.log("10. Testing modify_channel...");
  try {
    // Find a test channel or create one
    const textChannel = guild.channels.cache.find(
      (c) => c.type === 0 && c.name === "general"
    );

    if (!textChannel) {
      throw new Error("No text channel found for testing");
    }

    const originalTopic = textChannel.topic;

    // Modify the channel
    const modifyResult = await callMcpTool("modify_channel", {
      channelId: textChannel.id,
      topic: "Test topic modification - Admin Tools Test",
      slowmode: 5,
    });
    console.log(`   ✓ Modified channel settings\n`);
    testResults.push({ tool: "modify_channel", status: "PASS" });

    // Restore original topic
    await textChannel.edit({
      topic: originalTopic || null,
      rateLimitPerUser: 0,
    });
    console.log(`   ✓ Restored original channel settings\n`);
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "modify_channel", status: "FAIL", error: error.message });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));

  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;

  console.log(`\nTotal Tests: ${testResults.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / testResults.length) * 100).toFixed(1)}%\n`);

  if (failed > 0) {
    console.log("Failed Tests:");
    testResults
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  - ${r.tool}: ${r.error}`);
      });
  }

  console.log("\n" + "=".repeat(60) + "\n");

  process.exit(failed > 0 ? 1 : 0);
});

client.login(TOKEN);
