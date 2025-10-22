import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerModerationPrompts(server: McpServer) {
  server.registerPrompt(
    "moderate-channel",
    {
      title: "Channel Moderation Assistant",
      description: "Guides moderation of a Discord channel",
      argsSchema: {
        guildId: z.string().describe("Server to moderate"),
        channelId: z.string().describe("Channel to moderate"),
        moderationLevel: z
          .enum(["light", "standard", "strict"])
          .optional()
          .describe("Moderation strictness"),
      },
    },
    ({ guildId, channelId, moderationLevel = "standard" }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `You are moderating a Discord channel.

Guild ID: ${guildId}
Channel ID: ${channelId}
Moderation Level: ${moderationLevel}

Please follow these guidelines:
1. Review recent messages for policy violations
2. Check for spam, harassment, or inappropriate content
3. Use reactions to flag problematic messages
4. Delete messages that clearly violate rules
5. Document moderation actions

Before taking any action:
- Verify you have ManageMessages permission
- Consider the context and user history
- Ensure actions align with server rules

Available tools:
- read_messages: Review recent channel history
- delete_message: Remove violating content
- add_reaction: Flag messages for review
- send_message: Post moderation notices

What moderation action would you like to take?`,
          },
        },
      ],
    }),
  );

  server.registerPrompt(
    "create-announcement",
    {
      title: "Announcement Creator",
      description: "Guides creation of formatted Discord announcements",
      argsSchema: {
        channelId: z.string().describe("Announcement channel"),
        announcementType: z
          .enum(["update", "event", "notice", "alert"])
          .optional()
          .describe("Type of announcement"),
      },
    },
    ({ channelId, announcementType = "notice" }) => {
      const colorMap: Record<string, number> = {
        update: 0x0099ff,
        event: 0x00ff00,
        notice: 0xffff00,
        alert: 0xff0000,
      };

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Create a professional Discord announcement.

Channel ID: ${channelId}
Announcement Type: ${announcementType}
Suggested Color: ${colorMap[announcementType]}

Best practices:
1. Use embeds for better formatting
2. Include clear title and description
3. Add relevant emojis for visual appeal
4. Use color coding appropriately
5. Include timestamp or deadline if applicable
6. Add reaction options if seeking feedback

Use the send_message tool with embeds to create your announcement.

What is the content of your announcement?`,
            },
          },
        ],
      };
    },
  );
}
