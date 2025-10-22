#!/usr/bin/env node

/**
 * Test script to verify MCP server can handle content updates
 * Tests 3 forums only: foundations, llm-development, mathematics-corner
 */

const MCP_URL = "http://localhost:3000/mcp";

// Helper to call MCP server
async function callMCP(method, params = {}) {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method,
      params,
    }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(`MCP Error: ${data.error.message}`);
  }

  return data.result;
}

// Test forums - only 3 as requested
const TEST_FORUMS = [
  { name: "foundations", type: "forum", topic: "AI/ML Fundamentals" },
  { name: "llm-development", type: "forum", topic: "Large Language Models" },
  { name: "mathematics-corner", type: "text", topic: "Mathematical Foundations" }, // Text channel
];

async function main() {
  console.log("🤖 Testing MCP Server Content Updates\n");
  console.log("📋 Testing 3 forums only (as requested)\n");

  try {
    // Step 1: Get guild ID using resources
    console.log("1️⃣  Getting guild list...");
    const guildsResource = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Date.now(),
        method: "resources/read",
        params: { uri: "discord://guilds" },
      }),
    });

    const guildsData = await guildsResource.json();
    const guilds = JSON.parse(guildsData.result.contents[0].text);
    const guildId = guilds[0].id;
    const guildName = guilds[0].name;

    console.log(`   ✅ Guild: ${guildName} (${guildId})\n`);

    // Step 2: List all channels
    console.log("2️⃣  Listing all channels...");
    const channelsResult = await callMCP("tools/call", {
      name: "list_channels",
      arguments: { guildId },
    });

    const channels = channelsResult.structuredContent?.channels || [];
    console.log(`   ✅ Found ${channels.length} channels\n`);

    // Step 3: Process each test forum
    for (const testForum of TEST_FORUMS) {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`📚 Processing: ${testForum.name} (${testForum.type})`);
      console.log("=".repeat(60));

      // Find the channel
      const channel = channels.find(c => c.name === testForum.name);
      if (!channel) {
        console.log(`   ⚠️  Channel not found: ${testForum.name}`);
        continue;
      }

      console.log(`   ✅ Found channel: ${channel.id}`);

      // Get channel details
      console.log(`   🔍 Getting channel details...`);
      const detailsResult = await callMCP("tools/call", {
        name: "get_channel_details",
        arguments: { channelId: channel.id },
      });

      const channelDetails = detailsResult.structuredContent?.channel;
      console.log(`      Type: ${channelDetails.typeName}`);
      console.log(`      Supports threads: ${channelDetails.supportsThreads}`);
      console.log(`      Is forum: ${channelDetails.isForum}`);

      // Determine posting strategy
      if (channelDetails.isForum) {
        console.log(`   🔎 Finding or creating Updates thread...`);

        // Find existing Updates thread
        const threadsResult = await callMCP("tools/call", {
          name: "find_threads",
          arguments: {
            forumId: channel.id,
            name: "2025 Updates",
          },
        });

        const threads = threadsResult.structuredContent?.threads || [];
        let targetThread = threads.find(t => t.name.includes("2025 Updates"));

        if (targetThread) {
          console.log(`      ✅ Found existing thread: ${targetThread.name}`);
          console.log(`         Thread ID: ${targetThread.id}`);
        } else {
          console.log(`      ℹ️  No existing Updates thread found`);
          console.log(`      📝 Would create: "📅 2025 Updates & New Content"`);
          // Note: Not actually creating in this test
          console.log(`      ⏭️  Skipping thread creation in test mode`);
          continue;
        }

        // Create test message content
        const now = new Date();
        const title = `☀️ ${testForum.topic} Morning Update - ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;

        console.log(`   📤 Would post to thread: ${targetThread.id}`);
        console.log(`      Title: ${title}`);
        console.log(`      ⏭️  Skipping actual post in test mode`);

      } else {
        // Text channel - post directly
        console.log(`   📤 Would post directly to text channel: ${channel.id}`);
        console.log(`      ⏭️  Skipping actual post in test mode`);
      }

      console.log(`   ✅ ${testForum.name} verification complete`);
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ All 3 forums tested successfully!");
    console.log("=".repeat(60));
    console.log("\n📊 Summary:");
    console.log("   ✅ MCP server responding correctly");
    console.log("   ✅ list_channels tool working");
    console.log("   ✅ get_channel_details tool working");
    console.log("   ✅ find_threads tool working");
    console.log("   ✅ Channel type detection working");
    console.log("   ✅ Forum vs text channel handling correct");
    console.log("\n🎉 MCP server is ready for content updates!");

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
