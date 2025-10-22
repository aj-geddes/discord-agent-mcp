import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import { PermissionDeniedError, InvalidInputError } from "../errors/discord.js";
import { validateGuildAccess } from "../utils/guild-validation.js";
import { PermissionFlagsBits, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType, GuildScheduledEventStatus } from "discord.js";

export function registerScheduledEventTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // List Scheduled Events Tool
  server.registerTool(
    "list_scheduled_events",
    {
      title: "List Scheduled Events",
      description: "Get all scheduled events for a guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        withUserCount: z
          .boolean()
          .optional()
          .describe("Include interested user count (default: false)"),
      },
      outputSchema: {
        success: z.boolean(),
        events: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              scheduledStartTime: z.string(),
              scheduledEndTime: z.string().nullable(),
              status: z.string(),
              entityType: z.string(),
              channelId: z.string().nullable(),
              creatorId: z.string().nullable(),
              userCount: z.number().optional(),
              image: z.string().nullable(),
            }),
          )
          .optional(),
        count: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, withUserCount }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Fetch all scheduled events
        const events = await guild.scheduledEvents.fetch({ withUserCount });

        const eventList = events.map((event) => ({
          id: event.id,
          name: event.name,
          description: event.description || null,
          scheduledStartTime: event.scheduledStartAt?.toISOString() || "",
          scheduledEndTime: event.scheduledEndAt?.toISOString() || null,
          status: GuildScheduledEventStatus[event.status],
          entityType: GuildScheduledEventEntityType[event.entityType],
          channelId: event.channelId || null,
          creatorId: event.creatorId || null,
          userCount: event.userCount || undefined,
          image: event.coverImageURL() || null,
        }));

        const output = {
          success: true,
          events: eventList,
          count: eventList.length,
        };

        logger.info("Listed scheduled events", {
          guildId,
          count: eventList.length,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${eventList.length} scheduled events in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list scheduled events", {
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

  // Get Event Details Tool
  server.registerTool(
    "get_event_details",
    {
      title: "Get Event Details",
      description: "Get detailed information about a specific scheduled event",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        eventId: z.string().describe("Event ID"),
        withUserCount: z
          .boolean()
          .optional()
          .describe("Include interested user count (default: true)"),
      },
      outputSchema: {
        success: z.boolean(),
        event: z
          .object({
            id: z.string(),
            name: z.string(),
            description: z.string().nullable(),
            scheduledStartTime: z.string(),
            scheduledEndTime: z.string().nullable(),
            privacyLevel: z.string(),
            status: z.string(),
            entityType: z.string(),
            channelId: z.string().nullable(),
            entityMetadata: z.object({
              location: z.string().optional(),
            }).nullable(),
            creatorId: z.string().nullable(),
            userCount: z.number().optional(),
            image: z.string().nullable(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, eventId, withUserCount = true }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Fetch event
        const event = await guild.scheduledEvents.fetch({
          guildScheduledEvent: eventId,
          withUserCount,
        });

        if (!event) {
          throw new InvalidInputError("eventId", "Event not found");
        }

        const output = {
          success: true,
          event: {
            id: event.id,
            name: event.name,
            description: event.description || null,
            scheduledStartTime: event.scheduledStartAt?.toISOString() || "",
            scheduledEndTime: event.scheduledEndAt?.toISOString() || null,
            privacyLevel: GuildScheduledEventPrivacyLevel[event.privacyLevel],
            status: GuildScheduledEventStatus[event.status],
            entityType: GuildScheduledEventEntityType[event.entityType],
            channelId: event.channelId || null,
            entityMetadata: event.entityMetadata ? {
              location: event.entityMetadata.location || undefined,
            } : null,
            creatorId: event.creatorId || null,
            userCount: event.userCount || undefined,
            image: event.coverImageURL() || null,
          },
        };

        logger.info("Got event details", {
          guildId,
          eventId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Event: ${event.name}\nStatus: ${GuildScheduledEventStatus[event.status]}\nStarts: ${event.scheduledStartAt?.toISOString()}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get event details", {
          error: error.message,
          guildId,
          eventId,
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

  // Create Scheduled Event Tool
  server.registerTool(
    "create_scheduled_event",
    {
      title: "Create Scheduled Event",
      description: "Create a new scheduled event (stage, voice, or external)",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        name: z
          .string()
          .min(1)
          .max(100)
          .describe("Event name (1-100 characters)"),
        description: z
          .string()
          .min(1)
          .max(1000)
          .optional()
          .describe("Event description (1-1000 characters)"),
        scheduledStartTime: z
          .string()
          .describe("ISO 8601 timestamp for event start"),
        scheduledEndTime: z
          .string()
          .optional()
          .describe("ISO 8601 timestamp for event end (required for EXTERNAL)"),
        entityType: z
          .enum(["STAGE_INSTANCE", "VOICE", "EXTERNAL"])
          .describe("Event type: STAGE_INSTANCE, VOICE, or EXTERNAL"),
        channelId: z
          .string()
          .optional()
          .describe("Voice or stage channel ID (required for STAGE/VOICE)"),
        location: z
          .string()
          .optional()
          .describe("External location URL or address (required for EXTERNAL)"),
        image: z
          .string()
          .optional()
          .describe("Base64 encoded cover image"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        event: z
          .object({
            id: z.string(),
            name: z.string(),
            scheduledStartTime: z.string(),
            entityType: z.string(),
            url: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      guildId,
      name,
      description,
      scheduledStartTime,
      scheduledEndTime,
      entityType,
      channelId,
      location,
      image,
      reason,
    }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageEvents)) {
          throw new PermissionDeniedError("ManageEvents", guildId);
        }

        // Map entity type string to enum
        const entityTypeMap: Record<string, GuildScheduledEventEntityType> = {
          STAGE_INSTANCE: GuildScheduledEventEntityType.StageInstance,
          VOICE: GuildScheduledEventEntityType.Voice,
          EXTERNAL: GuildScheduledEventEntityType.External,
        };

        const mappedEntityType = entityTypeMap[entityType];

        // Validate required fields based on entity type
        if (
          (entityType === "STAGE_INSTANCE" || entityType === "VOICE") &&
          !channelId
        ) {
          throw new InvalidInputError(
            "channelId",
            "Required for STAGE_INSTANCE and VOICE events",
          );
        }

        if (entityType === "EXTERNAL" && !location) {
          throw new InvalidInputError(
            "location",
            "Required for EXTERNAL events",
          );
        }

        if (entityType === "EXTERNAL" && !scheduledEndTime) {
          throw new InvalidInputError(
            "scheduledEndTime",
            "Required for EXTERNAL events",
          );
        }

        // Create event
        const event = await guild.scheduledEvents.create({
          name,
          description,
          scheduledStartTime: new Date(scheduledStartTime),
          scheduledEndTime: scheduledEndTime
            ? new Date(scheduledEndTime)
            : undefined,
          privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
          entityType: mappedEntityType,
          channel: channelId || undefined,
          entityMetadata: location ? { location } : undefined,
          image: image || undefined,
          reason,
        });

        const output = {
          success: true,
          event: {
            id: event.id,
            name: event.name,
            scheduledStartTime: event.scheduledStartAt?.toISOString() || "",
            entityType: GuildScheduledEventEntityType[event.entityType],
            url: event.url,
          },
        };

        logger.info("Created scheduled event", {
          guildId,
          eventId: event.id,
          name,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Created event "${event.name}" in ${guild.name}\nURL: ${event.url}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create scheduled event", {
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

  // Modify Scheduled Event Tool
  server.registerTool(
    "modify_scheduled_event",
    {
      title: "Modify Scheduled Event",
      description: "Update an existing scheduled event",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        eventId: z.string().describe("Event ID"),
        name: z
          .string()
          .min(1)
          .max(100)
          .optional()
          .describe("New event name"),
        description: z
          .string()
          .min(1)
          .max(1000)
          .optional()
          .describe("New description"),
        scheduledStartTime: z
          .string()
          .optional()
          .describe("New start time (ISO 8601)"),
        scheduledEndTime: z
          .string()
          .optional()
          .describe("New end time (ISO 8601)"),
        entityType: z
          .enum(["STAGE_INSTANCE", "VOICE", "EXTERNAL"])
          .optional()
          .describe("New entity type"),
        channelId: z.string().optional().describe("New channel ID"),
        location: z.string().optional().describe("New external location"),
        status: z
          .enum(["ACTIVE", "COMPLETED", "CANCELED"])
          .optional()
          .describe("New event status"),
        image: z.string().optional().describe("New cover image (base64)"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        event: z
          .object({
            id: z.string(),
            name: z.string(),
            status: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      guildId,
      eventId,
      name,
      description,
      scheduledStartTime,
      scheduledEndTime,
      entityType,
      channelId,
      location,
      status,
      image,
      reason,
    }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageEvents)) {
          throw new PermissionDeniedError("ManageEvents", guildId);
        }

        // Fetch event
        const event = await guild.scheduledEvents.fetch(eventId);
        if (!event) {
          throw new InvalidInputError("eventId", "Event not found");
        }

        // Map entity type and status if provided
        const entityTypeMap: Record<string, GuildScheduledEventEntityType> = {
          STAGE_INSTANCE: GuildScheduledEventEntityType.StageInstance,
          VOICE: GuildScheduledEventEntityType.Voice,
          EXTERNAL: GuildScheduledEventEntityType.External,
        };

        const statusMap: Record<
          string,
          | GuildScheduledEventStatus.Active
          | GuildScheduledEventStatus.Completed
          | GuildScheduledEventStatus.Canceled
        > = {
          ACTIVE: GuildScheduledEventStatus.Active,
          COMPLETED: GuildScheduledEventStatus.Completed,
          CANCELED: GuildScheduledEventStatus.Canceled,
        };

        // Update event
        const updated = await event.edit({
          name,
          description,
          scheduledStartTime: scheduledStartTime
            ? new Date(scheduledStartTime)
            : undefined,
          scheduledEndTime: scheduledEndTime
            ? new Date(scheduledEndTime)
            : undefined,
          entityType: entityType ? entityTypeMap[entityType] : undefined,
          channel: channelId || undefined,
          entityMetadata: location ? { location } : undefined,
          status: status ? statusMap[status] : undefined,
          image: image || undefined,
          reason,
        });

        const output = {
          success: true,
          event: {
            id: updated.id,
            name: updated.name,
            status: GuildScheduledEventStatus[updated.status],
          },
        };

        logger.info("Modified scheduled event", {
          guildId,
          eventId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Updated event "${updated.name}" in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to modify scheduled event", {
          error: error.message,
          guildId,
          eventId,
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

  // Delete Scheduled Event Tool
  server.registerTool(
    "delete_scheduled_event",
    {
      title: "Delete Scheduled Event",
      description: "Delete (cancel) a scheduled event",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        eventId: z.string().describe("Event ID to delete"),
      },
      outputSchema: {
        success: z.boolean(),
        eventId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, eventId }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageEvents)) {
          throw new PermissionDeniedError("ManageEvents", guildId);
        }

        // Fetch and delete event
        const event = await guild.scheduledEvents.fetch(eventId);
        if (!event) {
          throw new InvalidInputError("eventId", "Event not found");
        }

        const eventName = event.name;
        await event.delete();

        const output = {
          success: true,
          eventId: eventId,
        };

        logger.info("Deleted scheduled event", {
          guildId,
          eventId,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted event "${eventName}" from ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to delete scheduled event", {
          error: error.message,
          guildId,
          eventId,
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

  // Get Event Users Tool
  server.registerTool(
    "get_event_users",
    {
      title: "Get Event Users",
      description: "Get users interested in a scheduled event",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        eventId: z.string().describe("Event ID"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe("Max users to return (1-100, default: 100)"),
        withMember: z
          .boolean()
          .optional()
          .describe("Include guild member data (default: false)"),
        before: z
          .string()
          .optional()
          .describe("User ID to get users before"),
        after: z.string().optional().describe("User ID to get users after"),
      },
      outputSchema: {
        success: z.boolean(),
        users: z
          .array(
            z.object({
              userId: z.string(),
              username: z.string(),
              discriminator: z.string(),
              guildMember: z
                .object({
                  nickname: z.string().nullable(),
                  roles: z.array(z.string()),
                  joinedAt: z.string().nullable(),
                })
                .optional(),
            }),
          )
          .optional(),
        count: z.number().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, eventId, limit = 100, withMember, before, after }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Fetch event
        const event = await guild.scheduledEvents.fetch(eventId);
        if (!event) {
          throw new InvalidInputError("eventId", "Event not found");
        }

        // Fetch interested users
        const users = await event.fetchSubscribers({
          limit,
          withMember,
          before,
          after,
        });

        const userList = users.map((subscriber) => {
          const member = subscriber.member;
          return {
            userId: subscriber.user.id,
            username: subscriber.user.username,
            discriminator: subscriber.user.discriminator,
            guildMember:
              member && withMember
                ? {
                    nickname: (member as any).nickname || null,
                    roles: (member as any).roles?.cache?.map((r: any) => r.id) || [],
                    joinedAt: (member as any).joinedAt?.toISOString() || null,
                  }
                : undefined,
          };
        });

        const output = {
          success: true,
          users: userList,
          count: userList.length,
        };

        logger.info("Got event users", {
          guildId,
          eventId,
          count: userList.length,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${userList.length} users interested in event "${event.name}"`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get event users", {
          error: error.message,
          guildId,
          eventId,
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
