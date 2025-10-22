import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";

export function registerGuildResources(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // List all guilds
  server.registerResource(
    "guilds-list",
    "discord://guilds",
    {
      title: "Discord Guilds",
      description: "List all Discord guilds the bot is a member of",
    },
    async (uri) => {
      try {
        const client = discordManager.getClient();
        const guilds = client.guilds.cache;

        const guildList = guilds.map((guild) => ({
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          ownerId: guild.ownerId,
        }));

        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "application/json",
              text: JSON.stringify(guildList, null, 2),
            },
          ],
        };
      } catch (error: any) {
        logger.error("Failed to list guilds", { error: error.message });
        throw error;
      }
    },
  );

  // Note: Dynamic resource parameters require more complex setup
  // For now, using get_server_info tool for guild-specific data
}
