import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import {
  PermissionDeniedError,
  ChannelNotFoundError,
  GuildNotFoundError,
} from "../errors/discord.js";
import { PermissionFlagsBits } from "discord.js";

export function registerModerationTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // Bulk Delete Messages Tool
  server.registerTool(
    "bulk_delete_messages",
    {
      title: "Bulk Delete Messages",
      description:
        "Delete multiple messages at once (max 100, must be <14 days old)",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        limit: z
          .number()
          .int()
          .min(2)
          .max(100)
          .describe("Number of messages to delete (2-100)"),
        filterUserId: z
          .string()
          .optional()
          .describe("Only delete messages from this user"),
        filterBots: z.boolean().optional().describe("Only delete bot messages"),
        reason: z
          .string()
          .optional()
          .describe("Reason for bulk delete (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        deletedCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, limit, filterUserId, filterBots, reason }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.ManageMessages)) {
            throw new PermissionDeniedError("ManageMessages", channelId);
          }
        }

        // Fetch messages
        const messages = await channel.messages.fetch({ limit });

        // Apply filters
        let messagesToDelete = Array.from(messages.values());

        if (filterUserId) {
          messagesToDelete = messagesToDelete.filter(
            (msg) => msg.author.id === filterUserId,
          );
        }

        if (filterBots) {
          messagesToDelete = messagesToDelete.filter((msg) => msg.author.bot);
        }

        // Filter out messages older than 14 days (Discord limitation)
        const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
        messagesToDelete = messagesToDelete.filter(
          (msg) => msg.createdTimestamp > twoWeeksAgo,
        );

        if (messagesToDelete.length === 0) {
          throw new Error(
            "No messages found matching criteria or all messages are too old (>14 days)",
          );
        }

        // Bulk delete
        if (!("bulkDelete" in channel)) {
          throw new ChannelNotFoundError(channelId);
        }

        const deleted = await (channel as any).bulkDelete(
          messagesToDelete,
          true,
        );
        const deletedCount = deleted.size;

        const output = {
          success: true,
          deletedCount,
        };

        logger.info("Bulk delete completed", {
          channelId,
          deletedCount,
          reason,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully deleted ${deletedCount} message(s)`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to bulk delete messages", {
          error: error.message,
          channelId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to bulk delete messages: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Get Bans Tool
  server.registerTool(
    "get_bans",
    {
      title: "Get Banned Users",
      description: "List all banned users in the server",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(100)
          .describe("Max bans to retrieve (max 1000)"),
      },
      outputSchema: {
        success: z.boolean(),
        bans: z
          .array(
            z.object({
              userId: z.string(),
              username: z.string(),
              reason: z.string().nullable(),
            }),
          )
          .optional(),
        totalCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, limit = 100 }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
          throw new PermissionDeniedError("BanMembers", guildId);
        }

        const bans = await guild.bans.fetch({ limit });

        const banList = bans.map((ban) => ({
          userId: ban.user.id,
          username: ban.user.username,
          reason: ban.reason,
        }));

        const output = {
          success: true,
          bans: banList,
          totalCount: banList.length,
        };

        logger.info("Bans retrieved", { guildId, count: banList.length });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${banList.length} banned user(s)`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get bans", {
          error: error.message,
          guildId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to get bans: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Nickname Member Tool
  server.registerTool(
    "set_nickname",
    {
      title: "Set Member Nickname",
      description: "Change a member's server nickname",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        userId: z.string().describe("User ID"),
        nickname: z
          .string()
          .max(32)
          .optional()
          .describe("New nickname (null/empty to remove)"),
        reason: z
          .string()
          .optional()
          .describe("Reason for nickname change (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        nickname: z.string().nullable().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, nickname, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ManageNicknames)) {
          throw new PermissionDeniedError("ManageNicknames", guildId);
        }

        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        // Check role hierarchy (can't change nickname of higher role)
        if (member.roles.highest.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot change nickname - member's highest role is equal to or higher than bot's",
          );
        }

        await member.setNickname(nickname || null, reason);

        const output = {
          success: true,
          userId,
          nickname: nickname || null,
        };

        logger.info("Nickname set", { guildId, userId, nickname, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: nickname
                ? `Nickname set to "${nickname}" for user ${userId}`
                : `Nickname removed for user ${userId}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to set nickname", {
          error: error.message,
          guildId,
          userId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to set nickname: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );
}
