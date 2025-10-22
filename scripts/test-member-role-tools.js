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

  // Test 1: List Members
  console.log("1. Testing list_members...");
  try {
    const result = await callMcpTool("list_members", {
      guildId,
      limit: 50,
    });
    const count = result.structuredContent?.totalCount || 0;
    console.log(`   ✓ Found ${count} members\n`);
    testResults.push({ tool: "list_members", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "list_members", status: "FAIL", error: error.message });
  }

  // Test 2: Get Member Info
  console.log("2. Testing get_member_info...");
  try {
    const botMember = await guild.members.fetchMe();
    const result = await callMcpTool("get_member_info", {
      guildId,
      userId: botMember.id,
    });
    const username = result.structuredContent?.member?.username;
    console.log(`   ✓ Retrieved member info for ${username}\n`);
    testResults.push({ tool: "get_member_info", status: "PASS" });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "get_member_info", status: "FAIL", error: error.message });
  }

  // Test 3: List Roles
  console.log("3. Testing list_roles...");
  try {
    const result = await callMcpTool("list_roles", {
      guildId,
    });
    const count = result.structuredContent?.totalCount || 0;
    console.log(`   ✓ Found ${count} roles\n`);
    testResults.push({ tool: "list_roles", status: "PASS", count });
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "list_roles", status: "FAIL", error: error.message });
  }

  // Test 4: Create Role
  console.log("4. Testing create_role...");
  try {
    const result = await callMcpTool("create_role", {
      guildId,
      name: "Test Admin Role",
      color: 0x00ff00,
      mentionable: true,
    });
    const roleId = result.structuredContent?.role?.id;
    console.log(`   ✓ Created role (ID: ${roleId})\n`);
    testResults.push({ tool: "create_role", status: "PASS", roleId });

    // Test 5: Modify Role
    console.log("5. Testing modify_role...");
    try {
      const modifyResult = await callMcpTool("modify_role", {
        guildId,
        roleId,
        name: "Modified Test Role",
        color: 0xff0000,
      });
      console.log(`   ✓ Modified role\n`);
      testResults.push({ tool: "modify_role", status: "PASS" });
    } catch (error) {
      console.log(`   ✗ FAILED: ${error.message}\n`);
      testResults.push({ tool: "modify_role", status: "FAIL", error: error.message });
    }

    // Test 6: Get Role Info
    console.log("6. Testing get_role_info...");
    try {
      const roleResult = await callMcpTool("get_role_info", {
        guildId,
        roleId,
      });
      const roleName = roleResult.structuredContent?.role?.name;
      console.log(`   ✓ Retrieved role info: ${roleName}\n`);
      testResults.push({ tool: "get_role_info", status: "PASS" });
    } catch (error) {
      console.log(`   ✗ FAILED: ${error.message}\n`);
      testResults.push({ tool: "get_role_info", status: "FAIL", error: error.message });
    }

    // Clean up - delete the role
    const role = await guild.roles.fetch(roleId);
    if (role) {
      await role.delete("Test cleanup");
      console.log(`   ✓ Cleaned up test role\n`);
    }
  } catch (error) {
    console.log(`   ✗ FAILED: ${error.message}\n`);
    testResults.push({ tool: "create_role", status: "FAIL", error: error.message });
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("MEMBER & ROLE TOOLS TEST SUMMARY");
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
