import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import { PermissionDeniedError, InvalidInputError } from "../errors/discord.js";
import { validateGuildAccess } from "../utils/guild-validation.js";
import { PermissionFlagsBits } from "discord.js";

export function registerStickerTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // List Guild Stickers Tool
  server.registerTool(
    "list_guild_stickers",
    {
      title: "List Guild Stickers",
      description: "Get all custom stickers for a guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
      },
      outputSchema: {
        success: z.boolean(),
        stickers: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              tags: z.string().nullable(),
              format: z.string(),
              available: z.boolean(),
              creator: z
                .object({
                  id: z.string(),
                  username: z.string(),
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

        // Fetch all stickers
        const stickers = await guild.stickers.fetch();

        const stickerList = stickers.map((sticker) => ({
          id: sticker.id,
          name: sticker.name,
          description: sticker.description || null,
          tags: sticker.tags || null,
          format: sticker.format === 1 ? "PNG" : sticker.format === 2 ? "APNG" : sticker.format === 3 ? "LOTTIE" : "UNKNOWN",
          available: sticker.available !== false,
          creator: sticker.user
            ? {
                id: sticker.user.id,
                username: sticker.user.username,
              }
            : undefined,
        }));

        const output = {
          success: true,
          stickers: stickerList,
          count: stickerList.length,
        };

        logger.info("Listed guild stickers", {
          guildId,
          count: stickerList.length,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${stickerList.length} custom stickers in guild ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list guild stickers", {
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

  // Create Sticker Tool
  server.registerTool(
    "create_sticker",
    {
      title: "Create Guild Sticker",
      description:
        "Upload a custom sticker to the guild (PNG, APNG, or Lottie JSON)",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        name: z
          .string()
          .min(2)
          .max(30)
          .describe("Sticker name (2-30 characters)"),
        description: z
          .string()
          .min(2)
          .max(100)
          .describe("Sticker description (2-100 characters)"),
        tags: z
          .string()
          .describe("Related emoji or keywords (comma-separated)"),
        file: z
          .string()
          .describe("File path or base64 data URI (PNG/APNG/Lottie JSON)"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        sticker: z
          .object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            tags: z.string(),
            format: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, name, description, tags, file, reason }) => {
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

        // Check guild boost level for sticker creation
        // Stickers require guild level 2 boost or higher (or verified/partnered)
        const hasFeature = guild.features.includes("VERIFIED") ||
          guild.features.includes("PARTNERED") ||
          guild.premiumTier >= 2;

        if (!hasFeature) {
          throw new InvalidInputError(
            "guild",
            "Guild must be level 2 boosted, verified, or partnered to create stickers",
          );
        }

        // Create sticker
        const sticker = await guild.stickers.create({
          file: file,
          name: name,
          tags: tags,
          description: description,
          reason: reason,
        });

        const output = {
          success: true,
          sticker: {
            id: sticker.id,
            name: sticker.name,
            description: sticker.description || "",
            tags: sticker.tags || "",
            format: sticker.format === 1 ? "PNG" : sticker.format === 2 ? "APNG" : sticker.format === 3 ? "LOTTIE" : "UNKNOWN",
          },
        };

        logger.info("Created sticker", {
          guildId,
          stickerId: sticker.id,
          name,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Created sticker "${sticker.name}" in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create sticker", {
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

  // Modify Sticker Tool
  server.registerTool(
    "modify_sticker",
    {
      title: "Modify Guild Sticker",
      description:
        "Update an existing custom sticker's name, description, or tags",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        stickerId: z.string().describe("Sticker ID to modify"),
        name: z
          .string()
          .min(2)
          .max(30)
          .optional()
          .describe("New sticker name"),
        description: z
          .string()
          .min(2)
          .max(100)
          .optional()
          .describe("New description"),
        tags: z.string().optional().describe("New tags"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        sticker: z
          .object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            tags: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, stickerId, name, description, tags, reason }) => {
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

        // Fetch sticker
        const sticker = await guild.stickers.fetch(stickerId);
        if (!sticker) {
          throw new InvalidInputError("stickerId", "Sticker not found");
        }

        // Update sticker
        const updated = await sticker.edit({
          name: name,
          description: description,
          tags: tags,
          reason: reason,
        });

        const output = {
          success: true,
          sticker: {
            id: updated.id,
            name: updated.name,
            description: updated.description || "",
            tags: updated.tags || "",
          },
        };

        logger.info("Modified sticker", {
          guildId,
          stickerId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Updated sticker "${updated.name}" in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to modify sticker", {
          error: error.message,
          guildId,
          stickerId,
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

  // Delete Sticker Tool
  server.registerTool(
    "delete_sticker",
    {
      title: "Delete Guild Sticker",
      description: "Delete a custom sticker from the guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        stickerId: z.string().describe("Sticker ID to delete"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        stickerId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, stickerId, reason }) => {
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

        // Fetch sticker
        const sticker = await guild.stickers.fetch(stickerId);
        if (!sticker) {
          throw new InvalidInputError("stickerId", "Sticker not found");
        }

        const stickerName = sticker.name;

        // Delete sticker
        await sticker.delete(reason);

        const output = {
          success: true,
          stickerId: stickerId,
        };

        logger.info("Deleted sticker", {
          guildId,
          stickerId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted sticker "${stickerName}" from ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to delete sticker", {
          error: error.message,
          guildId,
          stickerId,
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
