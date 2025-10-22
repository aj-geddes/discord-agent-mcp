import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import {
  PermissionDeniedError,
  GuildNotFoundError,
} from "../errors/discord.js";
import { PermissionFlagsBits, AuditLogEvent } from "discord.js";

export function registerServerTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // Modify Server Tool
  server.registerTool(
    "modify_server",
    {
      title: "Modify Server Settings",
      description: "Update server name, description, or other settings",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        name: z.string().min(2).max(100).optional().describe("New server name"),
        description: z
          .string()
          .max(120)
          .optional()
          .describe("New server description"),
        reason: z
          .string()
          .optional()
          .describe("Reason for modification (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        guild: z
          .object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, name, description, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        const updateOptions: any = {};
        if (name !== undefined) updateOptions.name = name;
        if (description !== undefined) updateOptions.description = description;
        if (reason !== undefined) updateOptions.reason = reason;

        const updatedGuild = await guild.edit(updateOptions);

        const output = {
          success: true,
          guild: {
            id: updatedGuild.id,
            name: updatedGuild.name,
            description: updatedGuild.description,
          },
        };

        logger.info("Server modified", { guildId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Server "${updatedGuild.name}" modified successfully`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to modify server", {
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
              text: `Failed to modify server: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Get Audit Logs Tool
  server.registerTool(
    "get_audit_logs",
    {
      title: "Get Server Audit Logs",
      description: "Retrieve recent audit log entries for the server",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .default(50)
          .describe("Number of entries to retrieve (max 100)"),
        userId: z
          .string()
          .optional()
          .describe("Filter by user who performed actions"),
        actionType: z
          .enum([
            "ALL",
            "MEMBER_KICK",
            "MEMBER_BAN_ADD",
            "MEMBER_BAN_REMOVE",
            "MEMBER_UPDATE",
            "MEMBER_ROLE_UPDATE",
            "CHANNEL_CREATE",
            "CHANNEL_DELETE",
            "CHANNEL_UPDATE",
            "ROLE_CREATE",
            "ROLE_DELETE",
            "ROLE_UPDATE",
            "MESSAGE_DELETE",
            "MESSAGE_BULK_DELETE",
          ])
          .optional()
          .default("ALL")
          .describe("Filter by action type"),
      },
      outputSchema: {
        success: z.boolean(),
        entries: z
          .array(
            z.object({
              id: z.string(),
              action: z.string(),
              executorId: z.string().nullable(),
              executorUsername: z.string().nullable(),
              targetId: z.string().nullable(),
              reason: z.string().nullable(),
              timestamp: z.string(),
            }),
          )
          .optional(),
        totalCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, limit = 50, userId, actionType = "ALL" }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
          throw new PermissionDeniedError("ViewAuditLog", guildId);
        }

        const fetchOptions: any = { limit };
        if (userId) fetchOptions.user = userId;
        if (actionType !== "ALL") {
          const actionMap: Record<string, AuditLogEvent> = {
            MEMBER_KICK: AuditLogEvent.MemberKick,
            MEMBER_BAN_ADD: AuditLogEvent.MemberBanAdd,
            MEMBER_BAN_REMOVE: AuditLogEvent.MemberBanRemove,
            MEMBER_UPDATE: AuditLogEvent.MemberUpdate,
            MEMBER_ROLE_UPDATE: AuditLogEvent.MemberRoleUpdate,
            CHANNEL_CREATE: AuditLogEvent.ChannelCreate,
            CHANNEL_DELETE: AuditLogEvent.ChannelDelete,
            CHANNEL_UPDATE: AuditLogEvent.ChannelUpdate,
            ROLE_CREATE: AuditLogEvent.RoleCreate,
            ROLE_DELETE: AuditLogEvent.RoleDelete,
            ROLE_UPDATE: AuditLogEvent.RoleUpdate,
            MESSAGE_DELETE: AuditLogEvent.MessageDelete,
            MESSAGE_BULK_DELETE: AuditLogEvent.MessageBulkDelete,
          };
          fetchOptions.type = actionMap[actionType];
        }

        const auditLogs = await guild.fetchAuditLogs(fetchOptions);

        const entries = auditLogs.entries.map((entry) => ({
          id: entry.id,
          action: AuditLogEvent[entry.action],
          executorId: entry.executorId,
          executorUsername: entry.executor?.username || null,
          targetId: entry.targetId,
          reason: entry.reason,
          timestamp: entry.createdAt.toISOString(),
        }));

        const output = {
          success: true,
          entries,
          totalCount: entries.length,
        };

        logger.info("Audit logs retrieved", {
          guildId,
          count: entries.length,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Retrieved ${entries.length} audit log entr${entries.length === 1 ? "y" : "ies"}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get audit logs", {
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
              text: `Failed to get audit logs: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // List Webhooks Tool
  server.registerTool(
    "list_webhooks",
    {
      title: "List Server Webhooks",
      description: "Get all webhooks in the server or a specific channel",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        channelId: z
          .string()
          .optional()
          .describe("Filter by channel ID (optional)"),
      },
      outputSchema: {
        success: z.boolean(),
        webhooks: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              channelId: z.string(),
              channelName: z.string().optional(),
              url: z.string(),
            }),
          )
          .optional(),
        totalCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, channelId }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
          throw new PermissionDeniedError("ManageWebhooks", guildId);
        }

        let webhooks;
        if (channelId) {
          const channel = await guild.channels.fetch(channelId);
          if (!channel || !("fetchWebhooks" in channel)) {
            throw new Error(
              "Invalid channel or channel doesn't support webhooks",
            );
          }
          webhooks = await channel.fetchWebhooks();
        } else {
          webhooks = await guild.fetchWebhooks();
        }

        const webhookList = webhooks.map((webhook) => ({
          id: webhook.id,
          name: webhook.name,
          channelId: webhook.channelId,
          channelName: guild.channels.cache.get(webhook.channelId)?.name,
          url: webhook.url,
        }));

        const output = {
          success: true,
          webhooks: webhookList,
          totalCount: webhookList.length,
        };

        logger.info("Webhooks listed", { guildId, count: webhookList.length });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${webhookList.length} webhook(s)`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list webhooks", {
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
              text: `Failed to list webhooks: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Create Webhook Tool
  server.registerTool(
    "create_webhook",
    {
      title: "Create Webhook",
      description: "Create a new webhook for a channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        name: z.string().min(1).max(80).describe("Webhook name"),
        reason: z
          .string()
          .optional()
          .describe("Reason for creating webhook (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        webhook: z
          .object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            token: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, name, reason }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !("createWebhook" in channel)) {
          throw new Error(
            "Invalid channel or channel doesn't support webhooks",
          );
        }

        if ("guild" in channel && channel.guild) {
          const botMember = await channel.guild.members.fetchMe();
          if (!botMember.permissions.has(PermissionFlagsBits.ManageWebhooks)) {
            throw new PermissionDeniedError("ManageWebhooks", channel.guild.id);
          }
        }

        const webhook = await (channel as any).createWebhook({
          name,
          reason,
        });

        const output = {
          success: true,
          webhook: {
            id: webhook.id,
            name: webhook.name,
            url: webhook.url,
            token: webhook.token || "",
          },
        };

        logger.info("Webhook created", { channelId, webhookId: webhook.id });

        return {
          content: [
            {
              type: "text" as const,
              text: `Webhook "${name}" created successfully`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create webhook", {
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
              text: `Failed to create webhook: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Get Invites Tool
  server.registerTool(
    "get_invites",
    {
      title: "Get Server Invites",
      description: "List all active invite links for the server",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
      },
      outputSchema: {
        success: z.boolean(),
        invites: z
          .array(
            z.object({
              code: z.string(),
              url: z.string(),
              channelId: z.string(),
              channelName: z.string().optional(),
              inviterId: z.string().nullable(),
              inviterUsername: z.string().nullable(),
              uses: z.number(),
              maxUses: z.number(),
              expiresAt: z.string().nullable(),
              temporary: z.boolean(),
            }),
          )
          .optional(),
        totalCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        const invites = await guild.invites.fetch();

        const inviteList = invites.map((invite) => ({
          code: invite.code,
          url: invite.url,
          channelId: invite.channelId || "",
          channelName: invite.channel?.name,
          inviterId: invite.inviterId,
          inviterUsername: invite.inviter?.username || null,
          uses: invite.uses || 0,
          maxUses: invite.maxUses || 0,
          expiresAt: invite.expiresAt?.toISOString() || null,
          temporary: invite.temporary || false,
        }));

        const output = {
          success: true,
          invites: inviteList,
          totalCount: inviteList.length,
        };

        logger.info("Invites retrieved", { guildId, count: inviteList.length });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${inviteList.length} active invite(s)`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get invites", {
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
              text: `Failed to get invites: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Create Invite Tool
  server.registerTool(
    "create_invite",
    {
      title: "Create Server Invite",
      description: "Create a new invite link for a channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID to create invite for"),
        maxAge: z
          .number()
          .int()
          .min(0)
          .max(604800)
          .optional()
          .describe("Invite expiration in seconds (0 = never, max 7 days)"),
        maxUses: z
          .number()
          .int()
          .min(0)
          .max(100)
          .optional()
          .describe("Max number of uses (0 = unlimited)"),
        temporary: z
          .boolean()
          .optional()
          .describe("Grant temporary membership"),
        unique: z
          .boolean()
          .optional()
          .default(true)
          .describe("Create a unique invite (don't reuse existing)"),
        reason: z
          .string()
          .optional()
          .describe("Reason for creating invite (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        invite: z
          .object({
            code: z.string(),
            url: z.string(),
            expiresAt: z.string().nullable(),
            maxUses: z.number(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      channelId,
      maxAge,
      maxUses,
      temporary,
      unique = true,
      reason,
    }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !("createInvite" in channel)) {
          throw new Error("Invalid channel or channel doesn't support invites");
        }

        if ("guild" in channel && channel.guild) {
          const botMember = await channel.guild.members.fetchMe();
          if (
            !botMember.permissions.has(PermissionFlagsBits.CreateInstantInvite)
          ) {
            throw new PermissionDeniedError(
              "CreateInstantInvite",
              channel.guild.id,
            );
          }
        }

        const invite = await (channel as any).createInvite({
          maxAge,
          maxUses,
          temporary,
          unique,
          reason,
        });

        const output = {
          success: true,
          invite: {
            code: invite.code,
            url: invite.url,
            expiresAt: invite.expiresAt?.toISOString() || null,
            maxUses: invite.maxUses || 0,
          },
        };

        logger.info("Invite created", { channelId, inviteCode: invite.code });

        return {
          content: [
            {
              type: "text" as const,
              text: `Invite created: ${invite.url}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create invite", {
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
              text: `Failed to create invite: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );
}
