import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import {
  PermissionDeniedError,
  GuildNotFoundError,
} from "../errors/discord.js";
import { PermissionFlagsBits, PermissionsBitField } from "discord.js";

export function registerRoleTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // Create Role Tool
  server.registerTool(
    "create_role",
    {
      title: "Create Server Role",
      description: "Create a new role in the server with specified permissions",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        name: z.string().max(100).describe("Role name"),
        color: z
          .number()
          .int()
          .min(0)
          .max(0xffffff)
          .optional()
          .describe("Role color as hex integer (e.g., 0x00ff00 for green)"),
        hoist: z
          .boolean()
          .optional()
          .describe("Display role members separately in sidebar"),
        mentionable: z
          .boolean()
          .optional()
          .describe("Allow anyone to @mention this role"),
        permissions: z
          .array(z.string())
          .optional()
          .describe(
            'Array of permission names (e.g., ["SendMessages", "ManageMessages"])',
          ),
        reason: z
          .string()
          .optional()
          .describe("Reason for role creation (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        role: z
          .object({
            id: z.string(),
            name: z.string(),
            color: z.number(),
            position: z.number(),
            permissions: z.array(z.string()),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      guildId,
      name,
      color,
      hoist,
      mentionable,
      permissions,
      reason,
    }) => {
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

        // Build permissions bitfield
        let permissionsBitField: bigint | undefined;
        if (permissions && permissions.length > 0) {
          permissionsBitField = new PermissionsBitField(permissions as any)
            .bitfield;
        }

        // Create role
        const role = await guild.roles.create({
          name,
          color,
          hoist,
          mentionable,
          permissions: permissionsBitField,
          reason,
        });

        const roleData = {
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
          permissions: role.permissions.toArray(),
        };

        const output = {
          success: true,
          role: roleData,
        };

        logger.info("Role created", { guildId, roleId: role.id, name });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully created role "${name}" (ID: ${role.id})`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create role", {
          error: error.message,
          guildId,
          name,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to create role: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Delete Role Tool
  server.registerTool(
    "delete_role",
    {
      title: "Delete Server Role",
      description: "Delete a role from the server",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        roleId: z.string().describe("Role ID to delete"),
        reason: z
          .string()
          .optional()
          .describe("Reason for role deletion (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        roleId: z.string().optional(),
        roleName: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, roleId, reason }) => {
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

        // Fetch role
        const role = await guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
          throw new Error(`Role ${roleId} not found in server`);
        }

        // Check if it's @everyone
        if (role.id === guild.id) {
          throw new Error("Cannot delete @everyone role");
        }

        // Check role hierarchy
        if (role.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot delete this role - it is equal to or higher than the bot's highest role",
          );
        }

        const roleName = role.name;
        await role.delete(reason);

        const output = {
          success: true,
          roleId,
          roleName,
        };

        logger.info("Role deleted", { guildId, roleId, roleName, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully deleted role "${roleName}"`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to delete role", {
          error: error.message,
          guildId,
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
              text: `Failed to delete role: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Modify Role Tool
  server.registerTool(
    "modify_role",
    {
      title: "Modify Server Role",
      description:
        "Update a role's name, color, permissions, or other settings",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        roleId: z.string().describe("Role ID to modify"),
        name: z.string().max(100).optional().describe("New role name"),
        color: z
          .number()
          .int()
          .min(0)
          .max(0xffffff)
          .optional()
          .describe("New role color as hex integer"),
        hoist: z
          .boolean()
          .optional()
          .describe("Display role members separately in sidebar"),
        mentionable: z
          .boolean()
          .optional()
          .describe("Allow anyone to @mention this role"),
        permissions: z
          .array(z.string())
          .optional()
          .describe(
            "Array of permission names to set (replaces all permissions)",
          ),
        reason: z
          .string()
          .optional()
          .describe("Reason for modification (shown in audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        role: z
          .object({
            id: z.string(),
            name: z.string(),
            color: z.number(),
            permissions: z.array(z.string()),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      guildId,
      roleId,
      name,
      color,
      hoist,
      mentionable,
      permissions,
      reason,
    }) => {
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

        // Fetch role
        const role = await guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
          throw new Error(`Role ${roleId} not found in server`);
        }

        // Check if it's @everyone and trying to change name
        if (role.id === guild.id && name) {
          throw new Error("Cannot rename @everyone role");
        }

        // Check role hierarchy
        if (role.position >= botMember.roles.highest.position) {
          throw new Error(
            "Cannot modify this role - it is equal to or higher than the bot's highest role",
          );
        }

        // Build update options
        const updateOptions: any = {};
        if (name !== undefined) updateOptions.name = name;
        if (color !== undefined) updateOptions.color = color;
        if (hoist !== undefined) updateOptions.hoist = hoist;
        if (mentionable !== undefined) updateOptions.mentionable = mentionable;
        if (permissions !== undefined) {
          updateOptions.permissions = new PermissionsBitField(
            permissions as any,
          ).bitfield;
        }
        if (reason !== undefined) updateOptions.reason = reason;

        // Update role
        const updatedRole = await role.edit(updateOptions);

        const roleData = {
          id: updatedRole.id,
          name: updatedRole.name,
          color: updatedRole.color,
          permissions: updatedRole.permissions.toArray(),
        };

        const output = {
          success: true,
          role: roleData,
        };

        logger.info("Role modified", { guildId, roleId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Successfully modified role "${updatedRole.name}"`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to modify role", {
          error: error.message,
          guildId,
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
              text: `Failed to modify role: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // List Roles Tool
  server.registerTool(
    "list_roles",
    {
      title: "List Server Roles",
      description: "Get all roles in the server with their permissions",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        includeEveryone: z
          .boolean()
          .optional()
          .default(false)
          .describe("Include @everyone role in results"),
      },
      outputSchema: {
        success: z.boolean(),
        roles: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              color: z.number(),
              position: z.number(),
              memberCount: z.number(),
              permissions: z.array(z.string()),
              hoist: z.boolean(),
              mentionable: z.boolean(),
              managed: z.boolean(),
            }),
          )
          .optional(),
        totalCount: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, includeEveryone = false }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Fetch all roles
        const roles = await guild.roles.fetch();

        // Filter out @everyone if requested
        let roleList = Array.from(roles.values());
        if (!includeEveryone) {
          roleList = roleList.filter((r) => r.id !== guild.id);
        }

        // Sort by position (highest first)
        roleList.sort((a, b) => b.position - a.position);

        const rolesData = roleList.map((role) => ({
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
          memberCount: role.members.size,
          permissions: role.permissions.toArray(),
          hoist: role.hoist,
          mentionable: role.mentionable,
          managed: role.managed,
        }));

        const output = {
          success: true,
          roles: rolesData,
          totalCount: rolesData.length,
        };

        logger.info("Roles listed", { guildId, count: rolesData.length });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${rolesData.length} role(s) in server`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list roles", {
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
              text: `Failed to list roles: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Get Role Info Tool
  server.registerTool(
    "get_role_info",
    {
      title: "Get Role Information",
      description: "Get detailed information about a specific role",
      inputSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        roleId: z.string().describe("Role ID to get info for"),
      },
      outputSchema: {
        success: z.boolean(),
        role: z
          .object({
            id: z.string(),
            name: z.string(),
            color: z.number(),
            position: z.number(),
            memberCount: z.number(),
            permissions: z.array(z.string()),
            hoist: z.boolean(),
            mentionable: z.boolean(),
            managed: z.boolean(),
            createdAt: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, roleId }) => {
      try {
        const client = discordManager.getClient();

        const guild = await client.guilds.fetch(guildId).catch(() => null);
        if (!guild) {
          throw new GuildNotFoundError(guildId);
        }

        // Fetch role
        const role = await guild.roles.fetch(roleId).catch(() => null);
        if (!role) {
          throw new Error(`Role ${roleId} not found in server`);
        }

        const roleData = {
          id: role.id,
          name: role.name,
          color: role.color,
          position: role.position,
          memberCount: role.members.size,
          permissions: role.permissions.toArray(),
          hoist: role.hoist,
          mentionable: role.mentionable,
          managed: role.managed,
          createdAt: role.createdAt.toISOString(),
        };

        const output = {
          success: true,
          role: roleData,
        };

        logger.info("Role info retrieved", { guildId, roleId });

        return {
          content: [
            {
              type: "text" as const,
              text: `Role: ${role.name}\nMembers: ${roleData.memberCount}\nPermissions: ${roleData.permissions.length}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get role info", {
          error: error.message,
          guildId,
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
              text: `Failed to get role info: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );
}
