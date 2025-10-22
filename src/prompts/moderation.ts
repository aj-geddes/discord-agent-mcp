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

  server.registerPrompt(
    "configure-automod-rule",
    {
      title: "Auto-Moderation Rule Setup",
      description:
        "Step-by-step wizard for configuring auto-moderation rules (Phase 3 preview)",
      argsSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        ruleType: z
          .enum([
            "keyword",
            "spam",
            "mention_spam",
            "keyword_preset",
            "member_profile",
          ])
          .optional()
          .describe("Type of auto-moderation rule to configure"),
      },
    },
    ({ guildId, ruleType = "keyword" }) => {
      const ruleTypeGuides: Record<string, string> = {
        keyword: `CUSTOM KEYWORD FILTER:
- Block specific words or phrases
- Supports wildcards and regex patterns
- Case-insensitive matching
- Custom keyword lists
- Useful for: Slurs, banned topics, spam phrases`,

        spam: `SPAM DETECTION:
- Detects message spam patterns
- Prevents rapid message flooding
- Catches repetitive content
- Automated rate limiting
- Useful for: Raid protection, spam bots`,

        mention_spam: `MENTION SPAM PREVENTION:
- Limits @mentions in single message
- Prevents mass ping attacks
- Protects against mention raids
- Configurable mention threshold
- Useful for: Preventing ping spam, raid protection`,

        keyword_preset: `DISCORD KEYWORD PRESETS:
- Pre-configured filter lists by Discord
- Categories: Profanity, Sexual Content, Slurs
- Maintained by Discord (auto-updated)
- No configuration needed
- Useful for: General content filtering`,

        member_profile: `MEMBER PROFILE FILTERING:
- Filters usernames and nicknames
- Blocks inappropriate display names
- Enforces naming policies
- Auto-renames or kicks violators
- Useful for: Professional servers, brand protection`,
      };

      const keywordConfig =
        ruleType === "keyword"
          ? `- Keyword List: Words/phrases to block
   - Allow List: Exceptions to keyword blocks
   - Example keywords: ["spam", "scam", "malware"]`
          : "";

      const mentionConfig =
        ruleType === "mention_spam"
          ? `- Mention Limit: Max mentions per message (recommended: 5-10)
   - Includes: @user mentions and @role mentions`
          : "";

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Auto-Moderation Rule Configuration Wizard

Guild ID: ${guildId}
Rule Type: ${ruleType.toUpperCase().replace(/_/g, " ")}

${ruleTypeGuides[ruleType]}

WARNING: PHASE 3 PREVIEW - Auto-Moderation tools will be available in v2.0.0 Phase 3

AUTO-MODERATION SETUP GUIDE:

1. RULE CONFIGURATION:

   Rule Name: Descriptive identifier
   - Example: "No Slurs", "Anti-Spam", "Mention Limit"

   Trigger Type: ${ruleType}
   ${keywordConfig}
   ${mentionConfig}

2. TRIGGER ACTIONS:

   Available Actions (can combine multiple):
   - Block Message: Prevent message from being sent
   - Send Alert: Notify moderators in a channel
   - Timeout Member: Temporary mute (duration configurable)

   Recommended combinations:
   - Keyword filter: Block + Alert
   - Spam: Block + Timeout (60 seconds)
   - Mention spam: Block + Alert + Timeout (5 minutes)

3. EXEMPTIONS:

   Roles exempt from rule:
   - Typically: @Moderator, @Admin
   - Allows staff to use blocked words for moderation
   - Use role IDs to specify exemptions

   Channels exempt from rule:
   - Admin channels
   - Testing channels
   - Bot command channels

4. ALERT CHANNEL:

   - Create dedicated #automod-alerts channel
   - Set permissions: Admin/Mod only
   - Receives notifications when rule triggers
   - Include: Username, message content, rule triggered, timestamp

AUTOMOD BEST PRACTICES:

1. Start Conservative:
   - Begin with preset filters
   - Add custom keywords gradually
   - Monitor false positives

2. Layer Your Defense:
   - Combine multiple rule types
   - Use keyword + spam detection together
   - Add mention limits for all public channels

3. Regular Maintenance:
   - Review triggered rules weekly
   - Update keyword lists based on trends
   - Adjust thresholds if needed
   - Remove outdated rules

4. Communication:
   - Inform members about auto-mod in #rules
   - Explain what content is filtered
   - Provide appeal process for false positives
   - Keep moderation transparent

5. Testing:
   - Create a mod-only test channel
   - Test rules before deploying server-wide
   - Verify exemptions work correctly
   - Check alert messages format properly

EXAMPLE AUTO-MOD SETUP FOR COMMUNITY SERVER:

Rule 1: "Profanity Filter"
- Type: keyword_preset
- Preset: Profanity
- Action: Block message
- Exempt: @Moderator, @Admin

Rule 2: "Spam Prevention"
- Type: spam
- Action: Block + Timeout (60s)
- Alert Channel: #mod-alerts

Rule 3: "Mention Spam Limit"
- Type: mention_spam
- Limit: 5 mentions
- Action: Block + Alert
- Exempt: @EventOrganizer (for announcements)

Rule 4: "Prohibited Topics"
- Type: keyword
- Keywords: ["referral", "cryptocurrency", "investment"]
- Action: Block + Alert
- Alert Channel: #automod-alerts

IMPLEMENTATION TIMELINE:

Phase 3 (Coming in v2.0.0 final) will include:
- create_automod_rule
- list_automod_rules
- modify_automod_rule
- delete_automod_rule
- get_automod_rule

TEMPORARY WORKAROUND:

Until Phase 3 is released, you can:
1. Use Discord's built-in Auto-Mod in Server Settings
2. Configure rules manually through Discord interface
3. Use read_messages + delete_message for manual moderation
4. Use timeout_member for violations
5. Document your desired auto-mod config for Phase 3 migration

Current Phase 2 moderation tools available:
- read_messages: Monitor channel content
- delete_message: Remove violating messages
- bulk_delete_messages: Clean up spam quickly
- timeout_member: Temporarily mute violators
- kick_member: Remove problematic users
- ban_member: Permanently ban repeat offenders

Would you like help setting up manual moderation workflows until auto-mod tools are available?`,
            },
          },
        ],
      };
    },
  );
}
