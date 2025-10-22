import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerServerSetupPrompts(server: McpServer) {
  server.registerPrompt(
    "setup-server",
    {
      title: "Server Setup Wizard",
      description: "Interactive wizard for organizing new server structure",
      argsSchema: {
        guildId: z.string().describe("Server/Guild ID to set up"),
        serverPurpose: z
          .enum(["community", "gaming", "project", "education", "social"])
          .optional()
          .describe("Primary purpose of the server"),
      },
    },
    ({ guildId, serverPurpose = "community" }) => {
      const purposeTemplates: Record<
        string,
        { categories: string[]; channels: string[] }
      > = {
        community: {
          categories: ["Welcome", "General", "Help & Support", "Off-Topic"],
          channels: [
            "welcome",
            "rules",
            "announcements",
            "general-chat",
            "introductions",
            "help",
            "off-topic",
          ],
        },
        gaming: {
          categories: [
            "Welcome",
            "General",
            "Voice Channels",
            "Game Channels",
          ],
          channels: [
            "welcome",
            "rules",
            "lfg",
            "general",
            "game-chat",
            "voice-1",
            "voice-2",
          ],
        },
        project: {
          categories: [
            "General",
            "Development",
            "Design",
            "Resources",
            "Archive",
          ],
          channels: [
            "announcements",
            "general",
            "dev-chat",
            "code-review",
            "design",
            "resources",
          ],
        },
        education: {
          categories: [
            "Information",
            "Classroom",
            "Study Groups",
            "Resources",
          ],
          channels: [
            "welcome",
            "syllabus",
            "announcements",
            "general",
            "q-and-a",
            "study-hall",
            "resources",
          ],
        },
        social: {
          categories: ["Welcome", "Hangout", "Activities", "Media"],
          channels: [
            "welcome",
            "introductions",
            "general",
            "events",
            "games",
            "media",
            "memes",
          ],
        },
      };

      const template = purposeTemplates[serverPurpose];

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Welcome to the Server Setup Wizard!

Guild ID: ${guildId}
Server Purpose: ${serverPurpose}

This wizard will help you create a well-organized Discord server structure.

RECOMMENDED STRUCTURE FOR ${serverPurpose.toUpperCase()} SERVERS:

Categories to create:
${template.categories.map((cat, i) => `${i + 1}. ${cat}`).join("\n")}

Suggested channels:
${template.channels.map((ch, i) => `${i + 1}. #${ch}`).join("\n")}

SETUP STEPS:

1. First, use get_server_info to understand current server state
2. Create categories using create_category
3. Create text channels using create_text_channel with parent parameter
4. Create voice channels using create_voice_channel if needed
5. Set up basic roles (Admin, Moderator, Member)
6. Configure channel permissions
7. Create welcome message in #welcome channel

BEST PRACTICES:
- Limit channels to avoid overwhelming new members (10-15 channels is ideal)
- Use clear, descriptive channel names
- Set channel topics to explain purpose
- Configure slowmode for announcement channels
- Set NSFW flag appropriately
- Order channels by importance (position parameter)

Available tools:
- get_server_info: View current server structure
- list_channels: See existing channels
- create_category: Organize channels into categories
- create_text_channel: Create text channels
- create_voice_channel: Create voice channels
- create_role: Set up permission roles
- modify_channel: Update channel settings
- set_channel_permissions: Configure access control

Would you like to proceed with the recommended structure, or would you prefer a custom setup?`,
            },
          },
        ],
      };
    },
  );

  server.registerPrompt(
    "setup-welcome-automation",
    {
      title: "Welcome Automation Setup",
      description: "Configure welcome messages and auto-roles for new members",
      argsSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        welcomeChannelId: z
          .string()
          .optional()
          .describe("Channel for welcome messages"),
      },
    },
    ({ guildId, welcomeChannelId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: `Configure Welcome Automation for your Discord server.

Guild ID: ${guildId}
${welcomeChannelId ? `Welcome Channel: ${welcomeChannelId}` : "Welcome Channel: Not specified"}

WELCOME AUTOMATION SETUP:

1. CREATE WELCOME CHANNEL (if not exists):
   - Use create_text_channel with name "welcome" or "introductions"
   - Set channel topic to explain how to get started
   - Configure permissions so only bot and admins can post

2. DESIGN WELCOME MESSAGE:
   - Use send_rich_message with an embed
   - Include server rules summary
   - Add reaction roles instructions
   - Provide links to important channels
   - Include getting started guide

3. SET UP AUTO-ROLES:
   - Create a "Member" role using create_role
   - Set basic permissions (read messages, send messages)
   - Document manual role assignment process
   - Note: Auto-role assignment requires a bot event listener (not available via MCP)

4. CREATE RULES CHANNEL:
   - Use create_text_channel with name "rules"
   - Post comprehensive server rules
   - Pin the rules message
   - Lock channel (only admins can post)

WELCOME MESSAGE TEMPLATE:

Title: "Welcome to [Server Name]!"
Description: Greet new members warmly
Fields:
- "📜 Rules": Link to #rules channel
- "👋 Introductions": Encourage members to introduce themselves
- "🎯 Get Started": First steps for new members
- "❓ Help": Where to ask questions
Color: 0x00ff00 (green for welcoming)
Thumbnail: Server icon
Footer: "Enjoy your stay!"

Available tools:
- get_server_info: Get server details and icon
- list_channels: Find existing channels
- create_text_channel: Create welcome/rules channels
- send_rich_message: Post formatted welcome message
- create_role: Set up member roles
- list_roles: View existing roles
- modify_channel: Configure channel settings
- pin_message: Pin important messages

Note: Automatic role assignment on member join requires Discord.js event listeners,
which are not available through MCP tools. You'll need to manually assign the Member
role or use a separate bot feature.

What would you like to set up first?`,
          },
        },
      ],
    }),
  );
}
