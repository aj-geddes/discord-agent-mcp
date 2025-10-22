import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import {
  PermissionDeniedError,
  GuildNotFoundError,
} from "../errors/discord.js";
import { PermissionFlagsBits } from "discord.js";

export function registerMemberTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // Kick Member Tool
  server.registerTool(
    "kick_member",
    {
      title: "Kick Member from Server",
      description: "Remove a member from the server (they can rejoin)",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to kick"),
        reason: z
          .string()
          .optional()
          .describe("Reason for kick (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        username: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
          throw new PermissionDeniedError("KickMembers", guildId);
        }

        // Fetch and kick member
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        // Check if bot can kick this member (role hierarchy)
        if (member.roles.highest.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot kick this member - their highest role is equal to or higher than the bot's highest role",
          );
        }

        const username = member.user.username;
        await member.kick(reason);

        const output = {
          success: true,
          userId,
          username,
        };

        logger.info("Member kicked", { guildId, userId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully kicked ${username} (${userId}) from server`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to kick member", {
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
              text: `Failed to kick member: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Ban Member Tool
  server.registerTool(
    "ban_member",
    {
      title: "Ban Member from Server",
      description: "Ban a member from the server (prevents rejoining)",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to ban"),
        reason: z
          .string()
          .optional()
          .describe("Reason for ban (shown in audit log)"),
        deleteMessageDays: z
          .number()
          .int()
          .min(0)
          .max(7)
          .optional()
          .describe("Delete messages from last N days (0-7)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        username: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, reason, deleteMessageDays }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
          throw new PermissionDeniedError("BanMembers", guildId);
        }

        // Fetch member (may not be in server)
        const member = await guild.members.fetch(userId).catch(() => null);

        // Check role hierarchy if member is in server
        if (member) {
          if (
            member.roles.highest.position >= botMember.roles.highest.position
          ) {
            throw new Error(
              "Cannot ban this member - their highest role is equal to or higher than the bot's highest role",
            );
          }
        }

        // Fetch user to get username
        const user = await client.users.fetch(userId);
        const username = user.username;

        await guild.members.ban(userId, {
          reason,
          deleteMessageSeconds: deleteMessageDays
            ? deleteMessageDays * 24 * 60 * 60
            : undefined,
        });

        const output = {
          success: true,
          userId,
          username,
        };

        logger.info("Member banned", { guildId, userId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully banned ${username} (${userId}) from server`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to ban member", {
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
              text: `Failed to ban member: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Unban Member Tool
  server.registerTool(
    "unban_member",
    {
      title: "Unban Member from Server",
      description: "Remove a ban, allowing the user to rejoin",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to unban"),
        reason: z
          .string()
          .optional()
          .describe("Reason for unban (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
          throw new PermissionDeniedError("BanMembers", guildId);
        }

        await guild.members.unban(userId, reason);

        const output = {
          success: true,
          userId,
        };

        logger.info("Member unbanned", { guildId, userId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully unbanned user ${userId}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to unban member", {
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
              text: `Failed to unban member: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Timeout Member Tool
  server.registerTool(
    "timeout_member",
    {
      title: "Timeout Member",
      description:
        "Temporarily mute a member (prevents sending messages, reactions, joining voice)",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to timeout"),
        durationMinutes: z
          .number()
          .int()
          .min(1)
          .max(40320)
          .describe("Timeout duration in minutes (max 28 days)"),
        reason: z
          .string()
          .optional()
          .describe("Reason for timeout (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        username: z.string().optional(),
        timeoutUntil: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, durationMinutes, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          throw new PermissionDeniedError("ModerateMembers", guildId);
        }

        // Fetch member
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        // Check role hierarchy
        if (member.roles.highest.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot timeout this member - their highest role is equal to or higher than the bot's highest role",
          );
        }

        const timeoutUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
        await member.timeout(durationMinutes * 60 * 1000, reason);

        const output = {
          success: true,
          userId,
          username: member.user.username,
          timeoutUntil: timeoutUntil.toISOString(),
        };

        logger.info("Member timed out", {
          guildId,
          userId,
          durationMinutes,
          reason,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully timed out ${member.user.username} for ${durationMinutes} minutes`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to timeout member", {
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
              text: `Failed to timeout member: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Remove Timeout Tool
  server.registerTool(
    "remove_timeout",
    {
      title: "Remove Member Timeout",
      description: "Remove timeout from a member, restoring their permissions",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to remove timeout from"),
        reason: z
          .string()
          .optional()
          .describe("Reason for removing timeout (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        username: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
          throw new PermissionDeniedError("ModerateMembers", guildId);
        }

        // Fetch member
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        await member.timeout(null, reason);

        const output = {
          success: true,
          userId,
          username: member.user.username,
        };

        logger.info("Timeout removed from member", { guildId, userId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully removed timeout from ${member.user.username}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to remove timeout", {
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
              text: `Failed to remove timeout: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Get Member Info Tool
  server.registerTool(
    "get_member_info",
    {
      title: "Get Member Information",
      description: "Get detailed information about a server member",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to get info for"),
      },
      outputSchema: {
        success: z.boolean(),
        member: z
          .object({
            userId: z.string(),
            username: z.string(),
            discriminator: z.string(),
            nickname: z.string().nullable(),
            joinedAt: z.string(),
            roles: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                color: z.number(),
                position: z.number(),
              }),
            ),
            isBot: z.boolean(),
            isOwner: z.boolean(),
            timeoutUntil: z.string().nullable(),
            avatar: z.string().nullable(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Fetch member
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        const memberData = {
          userId: member.user.id,
          username: member.user.username,
          discriminator: member.user.discriminator,
          nickname: member.nickname,
          joinedAt: member.joinedAt?.toISOString() || null,
          roles: member.roles.cache
            .filter((role) => role.id !== guild.id) // Exclude @everyone
            .map((role) => ({
              id: role.id,
              name: role.name,
              color: role.color,
              position: role.position,
            })),
          isBot: member.user.bot,
          isOwner: guild.ownerId === member.user.id,
          timeoutUntil:
            member.communicationDisabledUntil?.toISOString() || null,
          avatar: member.user.avatar,
        };

        const output = {
          success: true,
          member: memberData,
        };

        logger.info("Member info retrieved", { guildId, userId });

        return {
          content: [
            {
              type: "text" as const,
              text: `Member: ${member.user.username}${member.nickname ? ` (${member.nickname})` : ""}\nRoles: ${memberData.roles.length}\nJoined: ${memberData.joinedAt}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get member info", {
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
              text: `Failed to get member info: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // List Members Tool
  server.registerTool(
    "list_members",
    {
      title: "List Server Members",
      description: "List all members in the server with optional filters",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(1000)
          .optional()
          .default(100)
          .describe("Max members to return (default 100)"),
        roleId: z
          .string()
          .optional()
          .describe("Filter by role ID (only members with this role)"),
        botsOnly: z.boolean().optional().describe("Only return bot accounts"),
      },
      outputSchema: {
        success: z.boolean(),
        members: z
          .array(
            z.object({
              userId: z.string(),
              username: z.string(),
              nickname: z.string().nullable(),
              isBot: z.boolean(),
              joinedAt: z.string(),
              roleCount: z.number(),
            }),
          )
          .optional(),
        totalCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, limit = 100, roleId, botsOnly }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Fetch all members
        const members = await guild.members.fetch({ limit });

        // Apply filters
        let filteredMembers = Array.from(members.values());

        if (roleId) {
          filteredMembers = filteredMembers.filter((m) =>
            m.roles.cache.has(roleId),
          );
        }

        if (botsOnly) {
          filteredMembers = filteredMembers.filter((m) => m.user.bot);
        }

        const memberList = filteredMembers.map((member) => ({
          userId: member.user.id,
          username: member.user.username,
          nickname: member.nickname,
          isBot: member.user.bot,
          joinedAt: member.joinedAt?.toISOString() || "",
          roleCount: member.roles.cache.size - 1, // Exclude @everyone
        }));

        const output = {
          success: true,
          members: memberList,
          totalCount: memberList.length,
        };

        logger.info("Members listed", {
          guildId,
          count: memberList.length,
          roleId,
          botsOnly,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${memberList.length} member(s) in server`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list members", {
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
              text: `Failed to list members: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Assign Role Tool
  server.registerTool(
    "assign_role",
    {
      title: "Assign Role to Member",
      description: "Add a role to a server member",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to assign role to"),
        roleId: z.string().describe("Role ID to assign"),
        reason: z
          .string()
          .optional()
          .describe("Reason for role assignment (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        roleId: z.string().optional(),
        roleName: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, roleId, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          throw new PermissionDeniedError("ManageRoles", guildId);
        }

        // Fetch member and role
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        const role = await guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
          throw new Error(`Role ${roleId} not found in server`);
        }

        // Check role hierarchy
        if (role.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot assign this role - it is equal to or higher than the bot's highest role",
          );
        }

        await member.roles.add(role, reason);

        const output = {
          success: true,
          userId,
          roleId,
          roleName: role.name,
        };

        logger.info("Role assigned to member", {
          guildId,
          userId,
          roleId,
          reason,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully assigned role "${role.name}" to ${member.user.username}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to assign role", {
          error: error.message,
          guildId,
          userId,
          roleId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to assign role: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Remove Role Tool
  server.registerTool(
    "remove_role",
    {
      title: "Remove Role from Member",
      description: "Remove a role from a server member",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        userId: z.string().describe("User ID to remove role from"),
        roleId: z.string().describe("Role ID to remove"),
        reason: z
          .string()
          .optional()
          .describe("Reason for role removal (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        userId: z.string().optional(),
        roleId: z.string().optional(),
        roleName: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, userId, roleId, reason }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Check bot permissions
        const botMember = await guild.members.fetchMe();
        if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
          throw new PermissionDeniedError("ManageRoles", guildId);
        }

        // Fetch member and role
        const member = await guild.members.fetch(userId).catch(() => null);
        if (!member) {
          throw new Error(`Member ${userId} not found in server`);
        }

        const role = await guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
          throw new Error(`Role ${roleId} not found in server`);
        }

        // Check role hierarchy
        if (role.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot remove this role - it is equal to or higher than the bot's highest role",
          );
        }

        await member.roles.remove(role, reason);

        const output = {
          success: true,
          userId,
          roleId,
          roleName: role.name,
        };

        logger.info("Role removed from member", {
          guildId,
          userId,
          roleId,
          reason,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully removed role "${role.name}" from ${member.user.username}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to remove role", {
          error: error.message,
          guildId,
          userId,
          roleId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to remove role: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );
}
