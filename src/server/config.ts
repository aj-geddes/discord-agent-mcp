import { LogLevel } from "../utils/logger.js";

export interface ServerConfig {
  // Discord Configuration
  discordToken: string;

  // MCP Server Configuration
  serverName: string;
  serverVersion: string;

  // Transport Configuration
  transportMode: "stdio" | "http";
  httpPort: number;

  // Logging Configuration
  logLevel: LogLevel;
  logFormat: "json" | "pretty";

  // Discord Client Configuration
  reconnectMaxRetries: number;
  reconnectBackoffMs: number;
}

export function loadConfig(): ServerConfig {
  const discordToken = process.env.DISCORD_TOKEN;
  if (!discordToken) {
    throw new Error("DISCORD_TOKEN environment variable is required");
  }

  return {
    // Discord Configuration
    discordToken,

    // MCP Server Configuration
    serverName: process.env.MCP_SERVER_NAME || "discord-mcp-server",
    serverVersion: process.env.MCP_SERVER_VERSION || "2.0.0",

    // Transport Configuration
    transportMode: (process.env.TRANSPORT_MODE as "stdio" | "http") || "http",
    httpPort: parseInt(process.env.HTTP_PORT || "3000", 10),

    // Logging Configuration
    logLevel: (process.env.LOG_LEVEL as LogLevel) || "info",
    logFormat: (process.env.LOG_FORMAT as "json" | "pretty") || "json",

    // Discord Client Configuration
    reconnectMaxRetries: parseInt(process.env.RECONNECT_MAX_RETRIES || "5", 10),
    reconnectBackoffMs: parseInt(
      process.env.RECONNECT_BACKOFF_MS || "1000",
      10,
    ),
  };
}
