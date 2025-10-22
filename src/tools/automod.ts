import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import {
  PermissionDeniedError,
  InvalidInputError,
} from "../errors/discord.js";
import { validateGuildAccess } from "../utils/guild-validation.js";
import {
  PermissionFlagsBits,
  AutoModerationRuleTriggerType,
  AutoModerationRuleEventType,
  AutoModerationActionType,
  AutoModerationRuleKeywordPresetType,
} from "discord.js";

export function registerAutoModerationTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // List Auto-Moderation Rules Tool
  server.registerTool(
    "list_automod_rules",
    {
      title: "List Auto-Moderation Rules",
      description: "Get all auto-moderation rules for a guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
      },
      outputSchema: {
        success: z.boolean(),
        rules: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              enabled: z.boolean(),
              creatorId: z.string(),
              triggerType: z.string(),
              eventType: z.string(),
              exemptRoles: z.array(z.string()),
              exemptChannels: z.array(z.string()),
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

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        // Fetch auto-mod rules
        const rules = await guild.autoModerationRules.fetch();

        const ruleList = rules.map((rule) => ({
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled,
          creatorId: rule.creatorId,
          triggerType: AutoModerationRuleTriggerType[rule.triggerType],
          eventType: AutoModerationRuleEventType[rule.eventType],
          exemptRoles: rule.exemptRoles.map((r) => r.id),
          exemptChannels: rule.exemptChannels.map((c) => c.id),
        }));

        const output = {
          success: true,
          rules: ruleList,
          count: ruleList.length,
        };

        logger.info("Listed auto-mod rules", { guildId, count: ruleList.length });

        return {
          content: [
            {
              type: "text" as const,
              text: `Found ${ruleList.length} auto-moderation rules in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to list auto-mod rules", {
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

  // Get Auto-Moderation Rule Details Tool
  server.registerTool(
    "get_automod_rule",
    {
      title: "Get Auto-Moderation Rule Details",
      description: "Get detailed information about a specific auto-mod rule",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        ruleId: z.string().describe("Auto-moderation rule ID"),
      },
      outputSchema: {
        success: z.boolean(),
        rule: z
          .object({
            id: z.string(),
            name: z.string(),
            enabled: z.boolean(),
            creatorId: z.string(),
            triggerType: z.string(),
            eventType: z.string(),
            actions: z.array(z.any()),
            triggerMetadata: z.any().optional(),
            exemptRoles: z.array(z.string()),
            exemptChannels: z.array(z.string()),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, ruleId }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        // Fetch rule
        const rule = await guild.autoModerationRules.fetch(ruleId);
        if (!rule) {
          throw new InvalidInputError("ruleId", "Rule not found");
        }

        const ruleDetails = {
          id: rule.id,
          name: rule.name,
          enabled: rule.enabled,
          creatorId: rule.creatorId,
          triggerType: AutoModerationRuleTriggerType[rule.triggerType],
          eventType: AutoModerationRuleEventType[rule.eventType],
          actions: rule.actions.map((action) => ({
            type: AutoModerationActionType[action.type],
            metadata: action.metadata,
          })),
          triggerMetadata: rule.triggerMetadata,
          exemptRoles: rule.exemptRoles.map((r) => r.id),
          exemptChannels: rule.exemptChannels.map((c) => c.id),
        };

        const output = {
          success: true,
          rule: ruleDetails,
        };

        logger.info("Fetched auto-mod rule details", { guildId, ruleId });

        return {
          content: [
            {
              type: "text" as const,
              text: `Auto-mod rule "${rule.name}" details retrieved`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to get auto-mod rule", {
          error: error.message,
          guildId,
          ruleId,
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

  // Create Auto-Moderation Rule Tool
  server.registerTool(
    "create_automod_rule",
    {
      title: "Create Auto-Moderation Rule",
      description:
        "Create a new auto-moderation rule for keyword filtering, spam detection, or content moderation",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        name: z.string().min(1).max(100).describe("Rule name"),
        enabled: z
          .boolean()
          .optional()
          .describe("Enable rule immediately (default: true)"),
        triggerType: z
          .enum([
            "KEYWORD",
            "SPAM",
            "KEYWORD_PRESET",
            "MENTION_SPAM",
            "MEMBER_PROFILE",
          ])
          .describe("Trigger type for the rule"),
        eventType: z
          .enum(["MESSAGE_SEND", "MEMBER_UPDATE"])
          .optional()
          .describe("Event type (default: MESSAGE_SEND)"),
        keywords: z
          .array(z.string())
          .optional()
          .describe("Keywords to filter (for KEYWORD trigger)"),
        regexPatterns: z
          .array(z.string())
          .optional()
          .describe("Regex patterns (for KEYWORD trigger)"),
        allowList: z
          .array(z.string())
          .optional()
          .describe("Keywords to allow (exceptions)"),
        presets: z
          .array(z.enum(["PROFANITY", "SEXUAL_CONTENT", "SLURS"]))
          .optional()
          .describe("Preset keyword lists (for KEYWORD_PRESET trigger)"),
        mentionLimit: z
          .number()
          .min(1)
          .max(50)
          .optional()
          .describe("Max mentions per message (for MENTION_SPAM trigger)"),
        actions: z
          .array(
            z.object({
              type: z.enum(["BLOCK_MESSAGE", "SEND_ALERT_MESSAGE", "TIMEOUT"]),
              channelId: z.string().optional(),
              durationSeconds: z.number().optional(),
              customMessage: z.string().optional(),
            }),
          )
          .describe("Actions to take when rule triggers"),
        exemptRoles: z
          .array(z.string())
          .optional()
          .describe("Role IDs exempt from this rule"),
        exemptChannels: z
          .array(z.string())
          .optional()
          .describe("Channel IDs exempt from this rule"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        rule: z
          .object({
            id: z.string(),
            name: z.string(),
            enabled: z.boolean(),
            triggerType: z.string(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      guildId,
      name,
      enabled = true,
      triggerType,
      eventType = "MESSAGE_SEND",
      keywords,
      regexPatterns,
      allowList,
      presets,
      mentionLimit,
      actions,
      exemptRoles,
      exemptChannels,
      reason,
    }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        // Map trigger type
        const triggerTypeMap: Record<string, AutoModerationRuleTriggerType> = {
          KEYWORD: AutoModerationRuleTriggerType.Keyword,
          SPAM: AutoModerationRuleTriggerType.Spam,
          KEYWORD_PRESET: AutoModerationRuleTriggerType.KeywordPreset,
          MENTION_SPAM: AutoModerationRuleTriggerType.MentionSpam,
          MEMBER_PROFILE: AutoModerationRuleTriggerType.MemberProfile,
        };

        const eventTypeMap: Record<string, AutoModerationRuleEventType> = {
          MESSAGE_SEND: AutoModerationRuleEventType.MessageSend,
          MEMBER_UPDATE: AutoModerationRuleEventType.MemberUpdate,
        };

        const presetMap: Record<
          string,
          AutoModerationRuleKeywordPresetType
        > = {
          PROFANITY: AutoModerationRuleKeywordPresetType.Profanity,
          SEXUAL_CONTENT: AutoModerationRuleKeywordPresetType.SexualContent,
          SLURS: AutoModerationRuleKeywordPresetType.Slurs,
        };

        const actionTypeMap: Record<string, AutoModerationActionType> = {
          BLOCK_MESSAGE: AutoModerationActionType.BlockMessage,
          SEND_ALERT_MESSAGE: AutoModerationActionType.SendAlertMessage,
          TIMEOUT: AutoModerationActionType.Timeout,
        };

        // Build trigger metadata based on trigger type
        const triggerMetadata: any = {};

        if (triggerType === "KEYWORD") {
          if (keywords) triggerMetadata.keywordFilter = keywords;
          if (regexPatterns) triggerMetadata.regexPatterns = regexPatterns;
          if (allowList) triggerMetadata.allowList = allowList;
        } else if (triggerType === "KEYWORD_PRESET") {
          if (presets) {
            triggerMetadata.presets = presets.map((p) => presetMap[p]);
          }
          if (allowList) triggerMetadata.allowList = allowList;
        } else if (triggerType === "MENTION_SPAM") {
          if (mentionLimit) triggerMetadata.mentionTotalLimit = mentionLimit;
        }

        // Build actions
        const mappedActions = actions.map((action) => {
          const baseAction: any = {
            type: actionTypeMap[action.type],
          };

          if (action.type === "SEND_ALERT_MESSAGE" && action.channelId) {
            baseAction.metadata = { channelId: action.channelId };
            if (action.customMessage) {
              baseAction.metadata.customMessage = action.customMessage;
            }
          } else if (action.type === "TIMEOUT" && action.durationSeconds) {
            baseAction.metadata = { durationSeconds: action.durationSeconds };
          }

          return baseAction;
        });

        // Create the rule
        const rule = await guild.autoModerationRules.create({
          name,
          enabled,
          triggerType: triggerTypeMap[triggerType],
          eventType: eventTypeMap[eventType],
          triggerMetadata:
            Object.keys(triggerMetadata).length > 0
              ? triggerMetadata
              : undefined,
          actions: mappedActions,
          exemptRoles: exemptRoles || [],
          exemptChannels: exemptChannels || [],
          reason,
        });

        const output = {
          success: true,
          rule: {
            id: rule.id,
            name: rule.name,
            enabled: rule.enabled,
            triggerType: AutoModerationRuleTriggerType[rule.triggerType],
          },
        };

        logger.info("Created auto-mod rule", {
          guildId,
          ruleId: rule.id,
          name,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Created auto-mod rule "${rule.name}" in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to create auto-mod rule", {
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

  // Modify Auto-Moderation Rule Tool
  server.registerTool(
    "modify_automod_rule",
    {
      title: "Modify Auto-Moderation Rule",
      description: "Update an existing auto-moderation rule's settings",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        ruleId: z.string().describe("Auto-moderation rule ID"),
        name: z.string().min(1).max(100).optional().describe("New rule name"),
        enabled: z.boolean().optional().describe("Enable/disable rule"),
        keywords: z
          .array(z.string())
          .optional()
          .describe("Updated keywords (replaces existing)"),
        regexPatterns: z
          .array(z.string())
          .optional()
          .describe("Updated regex patterns (replaces existing)"),
        allowList: z
          .array(z.string())
          .optional()
          .describe("Updated allow list (replaces existing)"),
        mentionLimit: z
          .number()
          .min(1)
          .max(50)
          .optional()
          .describe("Updated mention limit"),
        actions: z
          .array(
            z.object({
              type: z.enum(["BLOCK_MESSAGE", "SEND_ALERT_MESSAGE", "TIMEOUT"]),
              channelId: z.string().optional(),
              durationSeconds: z.number().optional(),
              customMessage: z.string().optional(),
            }),
          )
          .optional()
          .describe("Updated actions (replaces existing)"),
        exemptRoles: z
          .array(z.string())
          .optional()
          .describe("Updated exempt roles (replaces existing)"),
        exemptChannels: z
          .array(z.string())
          .optional()
          .describe("Updated exempt channels (replaces existing)"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        rule: z
          .object({
            id: z.string(),
            name: z.string(),
            enabled: z.boolean(),
          })
          .optional(),
        error: z.string().optional(),
      },
    },
    async ({
      guildId,
      ruleId,
      name,
      enabled,
      keywords,
      regexPatterns,
      allowList,
      mentionLimit,
      actions,
      exemptRoles,
      exemptChannels,
      reason,
    }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        // Fetch existing rule
        const rule = await guild.autoModerationRules.fetch(ruleId);
        if (!rule) {
          throw new InvalidInputError("ruleId", "Rule not found");
        }

        const actionTypeMap: Record<string, AutoModerationActionType> = {
          BLOCK_MESSAGE: AutoModerationActionType.BlockMessage,
          SEND_ALERT_MESSAGE: AutoModerationActionType.SendAlertMessage,
          TIMEOUT: AutoModerationActionType.Timeout,
        };

        // Build updates
        const updates: any = {};

        if (name !== undefined) updates.name = name;
        if (enabled !== undefined) updates.enabled = enabled;

        // Update trigger metadata if provided
        if (
          keywords !== undefined ||
          regexPatterns !== undefined ||
          allowList !== undefined ||
          mentionLimit !== undefined
        ) {
          updates.triggerMetadata = { ...rule.triggerMetadata };

          if (keywords !== undefined)
            updates.triggerMetadata.keywordFilter = keywords;
          if (regexPatterns !== undefined)
            updates.triggerMetadata.regexPatterns = regexPatterns;
          if (allowList !== undefined)
            updates.triggerMetadata.allowList = allowList;
          if (mentionLimit !== undefined)
            updates.triggerMetadata.mentionTotalLimit = mentionLimit;
        }

        // Update actions if provided
        if (actions !== undefined) {
          updates.actions = actions.map((action) => {
            const baseAction: any = {
              type: actionTypeMap[action.type],
            };

            if (action.type === "SEND_ALERT_MESSAGE" && action.channelId) {
              baseAction.metadata = { channelId: action.channelId };
              if (action.customMessage) {
                baseAction.metadata.customMessage = action.customMessage;
              }
            } else if (action.type === "TIMEOUT" && action.durationSeconds) {
              baseAction.metadata = { durationSeconds: action.durationSeconds };
            }

            return baseAction;
          });
        }

        if (exemptRoles !== undefined) updates.exemptRoles = exemptRoles;
        if (exemptChannels !== undefined)
          updates.exemptChannels = exemptChannels;
        if (reason !== undefined) updates.reason = reason;

        // Update the rule
        const updated = await rule.edit(updates);

        const output = {
          success: true,
          rule: {
            id: updated.id,
            name: updated.name,
            enabled: updated.enabled,
          },
        };

        logger.info("Modified auto-mod rule", { guildId, ruleId });

        return {
          content: [
            {
              type: "text" as const,
              text: `Updated auto-mod rule "${updated.name}" in ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to modify auto-mod rule", {
          error: error.message,
          guildId,
          ruleId,
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

  // Delete Auto-Moderation Rule Tool
  server.registerTool(
    "delete_automod_rule",
    {
      title: "Delete Auto-Moderation Rule",
      description: "Delete an auto-moderation rule from the guild",
      inputSchema: {
        guildId: z.string().describe("Guild ID"),
        ruleId: z.string().describe("Auto-moderation rule ID to delete"),
        reason: z.string().optional().describe("Audit log reason"),
      },
      outputSchema: {
        success: z.boolean(),
        ruleId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ guildId, ruleId, reason }) => {
      try {
        const client = discordManager.getClient();
        const guild = await validateGuildAccess(client, guildId);

        // Check permissions
        const botMember = await guild.members.fetch(client.user!.id);
        if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
          throw new PermissionDeniedError("ManageGuild", guildId);
        }

        // Fetch and delete rule
        const rule = await guild.autoModerationRules.fetch(ruleId);
        if (!rule) {
          throw new InvalidInputError("ruleId", "Rule not found");
        }

        const ruleName = rule.name;
        await rule.delete(reason);

        const output = {
          success: true,
          ruleId: ruleId,
        };

        logger.info("Deleted auto-mod rule", { guildId, ruleId });

        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted auto-mod rule "${ruleName}" from ${guild.name}`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to delete auto-mod rule", {
          error: error.message,
          guildId,
          ruleId,
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
