import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { DiscordClientManager } from "../discord/client.js";
import { Logger } from "../utils/logger.js";
import { z } from "zod";
import {
  PermissionDeniedError,
  ChannelNotFoundError,
  MessageNotFoundError,
} from "../errors/discord.js";
import { embedSchema, messageSchema } from "../types/schemas.js";
import { PermissionFlagsBits } from "discord.js";

export function registerMessagingTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger,
) {
  // Send Message Tool
  server.registerTool(
    "send_message",
    {
      title: "Send Discord Message",
      description: "Send a message to a Discord channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID (snowflake) or name"),
        content: z.string().max(2000).describe("Message content"),
        embeds: z
          .array(embedSchema)
          .max(10)
          .optional()
          .describe("Optional embeds (max 10)"),
      },
      outputSchema: {
        success: z.boolean(),
        messageId: z.string().optional(),
        channelId: z.string().optional(),
        timestamp: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, content, embeds }) => {
      try {
        const client = discordManager.getClient();

        // Resolve channel
        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.SendMessages)) {
            throw new PermissionDeniedError("SendMessages", channelId);
          }
          if (
            channel.isThread() &&
            !permissions?.has(PermissionFlagsBits.SendMessagesInThreads)
          ) {
            throw new PermissionDeniedError("SendMessagesInThreads", channelId);
          }
        }

        // Send message (type narrowing for send method)
        if (!("send" in channel)) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.send({
          content,
          embeds: embeds || [],
        });

        const output = {
          success: true,
          messageId: message.id,
          channelId: channel.id,
          timestamp: message.createdAt.toISOString(),
        };

        logger.info("Message sent", { channelId, messageId: message.id });

        return {
          content: [
            {
              type: "text" as const,
              text: `Message sent successfully to <#${channel.id}>`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to send message", {
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
              text: `Failed to send message: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Read Messages Tool
  server.registerTool(
    "read_messages",
    {
      title: "Read Discord Messages",
      description: "Retrieve recent message history from a channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID or name"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .default(50)
          .describe("Number of messages to retrieve"),
        before: z
          .string()
          .optional()
          .describe("Get messages before this message ID"),
        after: z
          .string()
          .optional()
          .describe("Get messages after this message ID"),
      },
      outputSchema: {
        success: z.boolean(),
        messages: z.array(messageSchema).optional(),
        hasMore: z.boolean().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, limit, before, after }) => {
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
          if (!permissions?.has(PermissionFlagsBits.ViewChannel)) {
            throw new PermissionDeniedError("ViewChannel", channelId);
          }
          if (!permissions?.has(PermissionFlagsBits.ReadMessageHistory)) {
            throw new PermissionDeniedError("ReadMessageHistory", channelId);
          }
        }

        // Fetch messages
        const messages = await channel.messages.fetch({
          limit,
          before,
          after,
        });

        const formattedMessages = messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          author: {
            id: msg.author.id,
            username: msg.author.username,
            discriminator: msg.author.discriminator,
            bot: msg.author.bot,
            avatar: msg.author.avatar,
          },
          timestamp: msg.createdAt.toISOString(),
          editedTimestamp: msg.editedAt?.toISOString() || null,
          attachments: msg.attachments.map((att) => ({
            id: att.id,
            filename: att.name,
            size: att.size,
            url: att.url,
            contentType: att.contentType || undefined,
          })),
          embeds: msg.embeds.map((embed) => ({
            title: embed.title || undefined,
            description: embed.description || undefined,
            url: embed.url || undefined,
            color: embed.color || undefined,
            timestamp: embed.timestamp
              ? new Date(embed.timestamp).toISOString()
              : undefined,
          })),
          reactions: msg.reactions.cache.map((reaction) => ({
            emoji: reaction.emoji.name || reaction.emoji.id || "",
            count: reaction.count,
            me: reaction.me,
          })),
        }));

        const output = {
          success: true,
          messages: formattedMessages,
          hasMore: messages.size === limit,
        };

        logger.info("Messages retrieved", { channelId, count: messages.size });

        return {
          content: [
            {
              type: "text" as const,
              text: `Retrieved ${messages.size} message(s) from <#${channel.id}>`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to read messages", {
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
              text: `Failed to read messages: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Delete Message Tool
  server.registerTool(
    "delete_message",
    {
      title: "Delete Discord Message",
      description: "Delete a specific message from a channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        messageId: z.string().describe("Message ID to delete"),
        reason: z
          .string()
          .optional()
          .describe("Reason for deletion (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        deletedMessageId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, messageId, reason }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.messages
          .fetch(messageId)
          .catch(() => null);
        if (!message) {
          throw new MessageNotFoundError(messageId);
        }

        // Check permissions (bot can always delete own messages)
        if (message.author.id !== client.user!.id) {
          if ("guild" in channel && channel.guild) {
            const permissions = channel.permissionsFor(client.user!);
            if (!permissions?.has(PermissionFlagsBits.ManageMessages)) {
              throw new PermissionDeniedError("ManageMessages", channelId);
            }
          }
        }

        await message.delete();

        const output = {
          success: true,
          deletedMessageId: messageId,
        };

        logger.info("Message deleted", { channelId, messageId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Message ${messageId} deleted successfully`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to delete message", {
          error: error.message,
          channelId,
          messageId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to delete message: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Add Reaction Tool
  server.registerTool(
    "add_reaction",
    {
      title: "Add Reaction to Message",
      description: "Add an emoji reaction to a message",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        messageId: z.string().describe("Message ID"),
        emoji: z
          .string()
          .describe("Unicode emoji or custom emoji format (name:id)"),
      },
      outputSchema: {
        success: z.boolean(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, messageId, emoji }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.messages
          .fetch(messageId)
          .catch(() => null);
        if (!message) {
          throw new MessageNotFoundError(messageId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.AddReactions)) {
            throw new PermissionDeniedError("AddReactions", channelId);
          }
        }

        await message.react(emoji);

        const output = { success: true };

        logger.info("Reaction added", { channelId, messageId, emoji });

        return {
          content: [
            {
              type: "text" as const,
              text: `Reaction ${emoji} added to message`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to add reaction", {
          error: error.message,
          channelId,
          messageId,
          emoji,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to add reaction: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Edit Message Tool
  server.registerTool(
    "edit_message",
    {
      title: "Edit Discord Message",
      description: "Edit an existing message sent by the bot",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        messageId: z.string().describe("Message ID to edit"),
        content: z
          .string()
          .max(2000)
          .optional()
          .describe("New message content"),
        embeds: z
          .array(embedSchema)
          .max(10)
          .optional()
          .describe("New embeds (max 10)"),
      },
      outputSchema: {
        success: z.boolean(),
        messageId: z.string().optional(),
        editedTimestamp: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, messageId, content, embeds }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.messages
          .fetch(messageId)
          .catch(() => null);
        if (!message) {
          throw new MessageNotFoundError(messageId);
        }

        // Check if message was sent by the bot
        if (message.author.id !== client.user!.id) {
          throw new Error(
            "Can only edit messages sent by the bot. This message belongs to another user.",
          );
        }

        // Edit message
        const editedMessage = await message.edit({
          content: content || message.content,
          embeds: embeds || message.embeds,
        });

        const output = {
          success: true,
          messageId: editedMessage.id,
          editedTimestamp: editedMessage.editedAt?.toISOString(),
        };

        logger.info("Message edited", { channelId, messageId });

        return {
          content: [
            {
              type: "text" as const,
              text: `Message ${messageId} edited successfully`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to edit message", {
          error: error.message,
          channelId,
          messageId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to edit message: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Send Message with File Tool
  server.registerTool(
    "send_message_with_file",
    {
      title: "Send Discord Message with File",
      description: "Send a message with file attachment to a Discord channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID (snowflake) or name"),
        content: z
          .string()
          .max(2000)
          .optional()
          .describe("Message content (optional if file provided)"),
        filePath: z.string().describe("Absolute path to file to attach"),
        fileName: z
          .string()
          .optional()
          .describe(
            "Custom filename (optional, uses original if not provided)",
          ),
        embeds: z
          .array(embedSchema)
          .max(10)
          .optional()
          .describe("Optional embeds (max 10)"),
      },
      outputSchema: {
        success: z.boolean(),
        messageId: z.string().optional(),
        channelId: z.string().optional(),
        timestamp: z.string().optional(),
        attachmentUrl: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, content, filePath, fileName, embeds }) => {
      try {
        const client = discordManager.getClient();

        // Resolve channel
        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.SendMessages)) {
            throw new PermissionDeniedError("SendMessages", channelId);
          }
          if (!permissions?.has(PermissionFlagsBits.AttachFiles)) {
            throw new PermissionDeniedError("AttachFiles", channelId);
          }
          if (
            channel.isThread() &&
            !permissions?.has(PermissionFlagsBits.SendMessagesInThreads)
          ) {
            throw new PermissionDeniedError("SendMessagesInThreads", channelId);
          }
        }

        // Import fs module dynamically
        const fs = await import("fs");
        const path = await import("path");

        // Check if file exists
        if (!fs.existsSync(filePath)) {
          throw new Error(`File not found: ${filePath}`);
        }

        // Prepare attachment
        const attachment = {
          attachment: filePath,
          name: fileName || path.basename(filePath),
        };

        // Send message (type narrowing for send method)
        if (!("send" in channel)) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.send({
          content: content || undefined,
          embeds: embeds || [],
          files: [attachment],
        });

        const attachmentUrl =
          message.attachments.first()?.url || "No attachment URL";

        const output = {
          success: true,
          messageId: message.id,
          channelId: channel.id,
          timestamp: message.createdAt.toISOString(),
          attachmentUrl,
        };

        logger.info("Message with file sent", {
          channelId,
          messageId: message.id,
          filePath,
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Message with file sent successfully to <#${channel.id}>`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to send message with file", {
          error: error.message,
          channelId,
          filePath,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to send message with file: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Pin Message Tool
  server.registerTool(
    "pin_message",
    {
      title: "Pin Discord Message",
      description: "Pin a message to the channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        messageId: z.string().describe("Message ID to pin"),
        reason: z
          .string()
          .optional()
          .describe("Reason for pinning (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        pinnedMessageId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, messageId, reason }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.messages
          .fetch(messageId)
          .catch(() => null);
        if (!message) {
          throw new MessageNotFoundError(messageId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.ManageMessages)) {
            throw new PermissionDeniedError("ManageMessages", channelId);
          }
        }

        await message.pin(reason);

        const output = {
          success: true,
          pinnedMessageId: messageId,
        };

        logger.info("Message pinned", { channelId, messageId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Message ${messageId} pinned successfully`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to pin message", {
          error: error.message,
          channelId,
          messageId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to pin message: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Send Rich Message Tool
  server.registerTool(
    "send_rich_message",
    {
      title: "Send Rich Discord Message",
      description:
        "Send a richly formatted message with embeds, images, and advanced formatting. Supports full Discord markdown and embed features.",
      inputSchema: {
        channelId: z.string().describe("Channel ID (snowflake) or name"),
        content: z
          .string()
          .max(2000)
          .optional()
          .describe(
            "Message content with Discord markdown formatting (bold: **text**, italic: *text*, underline: __text__, strikethrough: ~~text~~, code: `code`, code block: ```language\\ncode\\n```)",
          ),
        embed: z
          .object({
            title: z.string().max(256).optional(),
            description: z.string().max(4096).optional(),
            url: z.string().url().optional(),
            color: z
              .number()
              .int()
              .min(0)
              .max(0xffffff)
              .optional()
              .describe("Hex color as integer (e.g., 0x00ff00 for green)"),
            image: z
              .string()
              .url()
              .optional()
              .describe("Large image URL at bottom of embed"),
            thumbnail: z
              .string()
              .url()
              .optional()
              .describe("Small image URL at top-right of embed"),
            author: z
              .object({
                name: z.string().max(256),
                url: z.string().url().optional(),
                iconURL: z.string().url().optional(),
              })
              .optional(),
            footer: z
              .object({
                text: z.string().max(2048),
                iconURL: z.string().url().optional(),
              })
              .optional(),
            fields: z
              .array(
                z.object({
                  name: z.string().max(256),
                  value: z.string().max(1024),
                  inline: z.boolean().optional(),
                }),
              )
              .max(25)
              .optional(),
            timestamp: z.boolean().optional().describe("Add current timestamp"),
          })
          .optional()
          .describe("Rich embed object with images and formatting"),
      },
      outputSchema: {
        success: z.boolean(),
        messageId: z.string().optional(),
        channelId: z.string().optional(),
        timestamp: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, content, embed }) => {
      try {
        const client = discordManager.getClient();

        // Resolve channel
        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.SendMessages)) {
            throw new PermissionDeniedError("SendMessages", channelId);
          }
          if (embed && !permissions?.has(PermissionFlagsBits.EmbedLinks)) {
            throw new PermissionDeniedError("EmbedLinks", channelId);
          }
          if (
            channel.isThread() &&
            !permissions?.has(PermissionFlagsBits.SendMessagesInThreads)
          ) {
            throw new PermissionDeniedError("SendMessagesInThreads", channelId);
          }
        }

        // Build embed if provided
        let embedPayload: any[] = [];
        if (embed) {
          const embedObj: any = {};

          if (embed.title) embedObj.title = embed.title;
          if (embed.description) embedObj.description = embed.description;
          if (embed.url) embedObj.url = embed.url;
          if (embed.color !== undefined) embedObj.color = embed.color;

          if (embed.author) {
            embedObj.author = {
              name: embed.author.name,
              url: embed.author.url,
              icon_url: embed.author.iconURL,
            };
          }

          if (embed.footer) {
            embedObj.footer = {
              text: embed.footer.text,
              icon_url: embed.footer.iconURL,
            };
          }

          if (embed.image) {
            embedObj.image = { url: embed.image };
          }

          if (embed.thumbnail) {
            embedObj.thumbnail = { url: embed.thumbnail };
          }

          if (embed.fields) {
            embedObj.fields = embed.fields;
          }

          if (embed.timestamp) {
            embedObj.timestamp = new Date().toISOString();
          }

          embedPayload = [embedObj];
        }

        // Send message (type narrowing for send method)
        if (!("send" in channel)) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.send({
          content: content || undefined,
          embeds: embedPayload,
        });

        const output = {
          success: true,
          messageId: message.id,
          channelId: channel.id,
          timestamp: message.createdAt.toISOString(),
        };

        logger.info("Rich message sent", { channelId, messageId: message.id });

        return {
          content: [
            {
              type: "text" as const,
              text: `Rich message sent successfully to <#${channel.id}>`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to send rich message", {
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
              text: `Failed to send rich message: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );

  // Unpin Message Tool
  server.registerTool(
    "unpin_message",
    {
      title: "Unpin Discord Message",
      description: "Unpin a message from the channel",
      inputSchema: {
        channelId: z.string().describe("Channel ID"),
        messageId: z.string().describe("Message ID to unpin"),
        reason: z
          .string()
          .optional()
          .describe("Reason for unpinning (audit log)"),
      },
      outputSchema: {
        success: z.boolean(),
        unpinnedMessageId: z.string().optional(),
        error: z.string().optional(),
      },
    },
    async ({ channelId, messageId, reason }) => {
      try {
        const client = discordManager.getClient();

        const channel = await client.channels
          .fetch(channelId)
          .catch(() => null);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        const message = await channel.messages
          .fetch(messageId)
          .catch(() => null);
        if (!message) {
          throw new MessageNotFoundError(messageId);
        }

        // Check permissions
        if ("guild" in channel && channel.guild) {
          const permissions = channel.permissionsFor(client.user!);
          if (!permissions?.has(PermissionFlagsBits.ManageMessages)) {
            throw new PermissionDeniedError("ManageMessages", channelId);
          }
        }

        await message.unpin(reason);

        const output = {
          success: true,
          unpinnedMessageId: messageId,
        };

        logger.info("Message unpinned", { channelId, messageId, reason });

        return {
          content: [
            {
              type: "text" as const,
              text: `Message ${messageId} unpinned successfully`,
            },
          ],
          structuredContent: output,
        };
      } catch (error: any) {
        logger.error("Failed to unpin message", {
          error: error.message,
          channelId,
          messageId,
        });

        const output = {
          success: false,
          error: error.message,
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to unpin message: ${error.message}`,
            },
          ],
          structuredContent: output,
          isError: true,
        };
      }
    },
  );
}
