import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import { PermissionDeniedError, InvalidInputError } from "../errors/discord.js";
import { validateGuildAccess } from "../utils/guild-validation.js";
import { PermissionFlagsBits } from "discord.js";

export function registerEmojiTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // List Guild Emojis Tool
  server.registerTool(
    "list_guild_emojis",
    {
      title: "List Guild Emojis",
      description: "Get all custom emojis for a guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
      },
      outputSchema: {
        success: z.boolean(),
        emojis: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              animated: z.boolean(),
              available: z.boolean(),
              managed: z.boolean(),
              requireColons: z.boolean(),
              roles: z.array(z.string()).optional(),
              creator: z
                .object({
                  id: z.string(),
                  username: z.string(),
                  discriminator: z.string(),
                })
                .optional(),
            }),
          )
          .optional(),
        count: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Fetch all emojis
        const emojis = await guild.emojis.fetch();

        const emojiList = emojis.map((emoji) => ({
          id: emoji.id,
          name: emoji.name || "unknown",
          animated: emoji.animated || false,
          available: emoji.available !== false,
          managed: emoji.managed || false,
          requireColons: emoji.requiresColons || false,
          roles: emoji.roles?.cache.map((r) => r.id) || [],
          creator: emoji.author
            ? {
                id: emoji.author.id,
                username: emoji.author.username,
                discriminator: emoji.author.discriminator,
              }
            : undefined,
        }));

        const output = {
          success: true,
          emojis: emojiList,
          count: emojiList.length,
        };

        logger.info("Listed guild emojis", { guildId, count: emojiList.length });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${emojiList.length} custom emojis in guild ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list guild emojis", {
          error: error.message,
          guildId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${error.message}`,
            },
          ],
          structuredContent: {
            success: false,
            error: error.message,
          },
        };
      }
    },
  );

  // Create Emoji Tool
  server.registerTool(
    "create_emoji",
    {
      title: "Create Guild Emoji",
      description:
        "Upload a custom emoji to the guild from base64 image data or file path",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        name: z
          .string()
          .min(2)
          .max(32)
          .regex(/^\w+$/)
          .describe("Emoji name (2-32 alphanumeric characters and underscores)"),
        image: z
          .string()
          .describe(
            "Base64 encoded image data (data:image/png;base64,...) or file path",
          ),
        roles: z
          .array(z.string())
          .optional()
          .describe("Array of role IDs that can use this emoji"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        emoji: z
          .object({
            id: z.string(),
            name: z.string(),
            animated: z.boolean(),
            url: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, name, image, roles, reason }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (
          !botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions)
        ) {
          throw new PermissionDeniedError(
            "ManageGuildExpressions",
            guildId,
          );
        }

        // Validate image format
        if (!image.startsWith("data:image/") && !image.startsWith("/")) {
          throw new InvalidInputError(
            "image",
            "Must be base64 data URI or absolute file path",
          );
        }

        // Create emoji
        const emoji = await guild.emojis.create({
          attachment: image,
          name: name,
          roles: roles || [],
          reason: reason,
        });

        const output = {
          success: true,
          emoji: {
            id: emoji.id,
            name: emoji.name || name,
            animated: emoji.animated || false,
            url: emoji.imageURL() || "",
          },
        };

        logger.info("Created emoji", {
          guildId,
          emojiId: emoji.id,
          name,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Created emoji :${emoji.name}: in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create emoji", {
          error: error.message,
          guildId,
          name,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${error.message}`,
            },
          ],
          structuredContent: {
            success: false,
            error: error.message,
          },
        };
      }
    },
  );

  // Modify Emoji Tool
  server.registerTool(
    "modify_emoji",
    {
      title: "Modify Guild Emoji",
      description: "Update an existing custom emoji's name or role restrictions",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        emojiId: z.string().describe("Emoji ID to modify"),
        name: z
          .string()
          .min(2)
          .max(32)
          .regex(/^\w+$/)
          .optional()
          .describe("New emoji name"),
        roles: z
          .array(z.string())
          .optional()
          .describe("New array of role IDs (replaces existing)"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        emoji: z
          .object({
            id: z.string(),
            name: z.string(),
            roles: z.array(z.string()),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, emojiId, name, roles, reason }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (
          !botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions)
        ) {
          throw new PermissionDeniedError(
            "ManageGuildExpressions",
            guildId,
          );
        }

        // Fetch emoji
        const emoji = await guild.emojis.fetch(emojiId);
        if (!emoji) {
          throw new InvalidInputError("emojiId", "Emoji not found");
        }

        // Update emoji
        const updated = await emoji.edit({
          name: name,
          roles: roles,
          reason: reason,
        });

        const output = {
          success: true,
          emoji: {
            id: updated.id,
            name: updated.name || "",
            roles: updated.roles?.cache.map((r) => r.id) || [],
          },
        };

        logger.info("Modified emoji", {
          guildId,
          emojiId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Updated emoji :${updated.name}: in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to modify emoji", {
          error: error.message,
          guildId,
          emojiId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${error.message}`,
            },
          ],
          structuredContent: {
            success: false,
            error: error.message,
          },
        };
      }
    },
  );

  // Delete Emoji Tool
  server.registerTool(
    "delete_emoji",
    {
      title: "Delete Guild Emoji",
      description: "Delete a custom emoji from the guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        emojiId: z.string().describe("Emoji ID to delete"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        emojiId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, emojiId, reason }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (
          !botMember.permissions.has(PermissionFlagsBits.ManageGuildExpressions)
        ) {
          throw new PermissionDeniedError(
            "ManageGuildExpressions",
            guildId,
          );
        }

        // Fetch emoji
        const emoji = await guild.emojis.fetch(emojiId);
        if (!emoji) {
          throw new InvalidInputError("emojiId", "Emoji not found");
        }

        const emojiName = emoji.name;

        // Delete emoji
        await emoji.delete(reason);

        const output = {
          success: true,
          emojiId: emojiId,
        };

        logger.info("Deleted emoji", {
          guildId,
          emojiId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted emoji :${emojiName}: from ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to delete emoji", {
          error: error.message,
          guildId,
          emojiId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${error.message}`,
            },
          ],
          structuredContent: {
            success: false,
            error: error.message,
          },
        };
      }
    },
  );
}
