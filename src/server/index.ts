import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { DiscordClientManager } from "../discord/client.js";
import { registerMessagingTools } from "../tools/messaging.js";
import { registerChannelTools } from "../tools/channels.js";
import { registerMemberTools } from "../tools/members.js";
import { registerRoleTools } from "../tools/roles.js";
import { registerServerTools } from "../tools/server.js";
import { registerModerationTools } from "../tools/moderation.js";
import { registerEmojiTools } from "../tools/emojis.js";
import { registerStickerTools } from "../tools/stickers.js";
import { registerScheduledEventTools } from "../tools/scheduled-events.js";
import { registerGuildResources } from "../resources/guilds.js";
import { registerModerationPrompts } from "../prompts/moderation.js";
import { registerServerSetupPrompts } from "../prompts/server-setup.js";
import { registerEventPrompts } from "../prompts/events.js";
import { registerPermissionPrompts } from "../prompts/permissions.js";
import { Logger } from "../utils/logger.js";
import { loadConfig } from "./config.js";

async function main() {
  const config = loadConfig();
  const logger = new Logger(config.logLevel, config.logFormat);

  logger.info("Starting Discord MCP Server", {
    version: config.serverVersion,
    transportMode: config.transportMode,
  });

  // Initialize Discord client ONCE at startup
  const discordManager = new DiscordClientManager(config.discordToken, logger, {
    maxReconnectAttempts: config.reconnectMaxRetries,
    reconnectBackoffMs: config.reconnectBackoffMs,
  });

  try {
    await discordManager.connect();
    logger.info(
      "Discord client connected successfully",
      discordManager.getStats(),
    );
  } catch (error: any) {
    logger.error("Failed to initialize Discord client", {
      error: error.message,
    });
    process.exit(1);
  }

  // Create MCP server
  const mcpServer = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  // Register tools
  logger.info("Registering tools...");
  registerMessagingTools(mcpServer, discordManager, logger);
  registerChannelTools(mcpServer, discordManager, logger);
  registerMemberTools(mcpServer, discordManager, logger);
  registerRoleTools(mcpServer, discordManager, logger);
  registerServerTools(mcpServer, discordManager, logger);
  registerModerationTools(mcpServer, discordManager, logger);
  registerEmojiTools(mcpServer, discordManager, logger);
  registerStickerTools(mcpServer, discordManager, logger);
  registerScheduledEventTools(mcpServer, discordManager, logger);

  // Register resources
  logger.info("Registering resources...");
  registerGuildResources(mcpServer, discordManager, logger);

  // Register prompts
  logger.info("Registering prompts...");
  registerModerationPrompts(mcpServer);
  registerServerSetupPrompts(mcpServer);
  registerEventPrompts(mcpServer);
  registerPermissionPrompts(mcpServer);

  // Setup transport based on configuration
  if (config.transportMode === "stdio") {
    logger.info("Starting with stdio transport");
    const transport = new StdioServerTransport();
    await mcpServer.connect(transport);
    logger.info("MCP Server ready (stdio)");
  } else {
    // HTTP transport with Express
    logger.info("Starting with HTTP transport", { port: config.httpPort });
    const app = express();
    app.use(express.json());

    // Health check endpoint
    app.get("/health", (_req, res) => {
      const stats = discordManager.getStats();
      res.json({
        status: stats.connected ? "healthy" : "unhealthy",
        server: {
          name: config.serverName,
          version: config.serverVersion,
        },
        discord: stats,
      });
    });

    // MCP endpoint
    app.post("/mcp", async (_req, res) => {
      try {
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        res.on("close", () => {
          transport.close();
        });

        await mcpServer.connect(transport);
        await transport.handleRequest(_req, res, _req.body);
      } catch (error: any) {
        logger.error("Error handling MCP request", { error: error.message });
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: "2.0",
            error: {
              code: -32603,
              message: "Internal server error",
            },
            id: null,
          });
        }
      }
    });

    app
      .listen(config.httpPort, () => {
        logger.info(
          `MCP Server running on http://localhost:${config.httpPort}/mcp`,
        );
      })
      .on("error", (error: any) => {
        logger.error("Server error", { error: error.message });
        process.exit(1);
      });
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    await discordManager.disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  // Log unhandled errors
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection", { reason, promise });
  });

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception", {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
