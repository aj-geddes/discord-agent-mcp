import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerEventPrompts(server: McpServer) {
  server.registerPrompt(
    "create-scheduled-event",
    {
      title: "Event Creation Wizard",
      description: "Guided wizard for creating Discord scheduled events",
      argsSchema: {
        guildId: z.string().describe("Server/Guild ID"),
        eventType: z
          .enum(["STAGE_INSTANCE", "VOICE", "EXTERNAL"])
          .optional()
          .describe("Type of event to create"),
      },
    },
    ({ guildId, eventType = "VOICE" }) => {
      const eventTypeGuides: Record<string, string> = {
        STAGE_INSTANCE: `STAGE INSTANCE EVENTS:
- Best for: Presentations, Q&A sessions, town halls, podcasts
- Requires: A Stage Channel in your server
- Features: Controlled speaker system with audience
- Attendees can "raise hand" to speak
- Great for structured discussions with many participants`,

        VOICE: `VOICE CHANNEL EVENTS:
- Best for: Casual meetups, gaming sessions, watch parties
- Requires: A Voice Channel in your server
- Features: Open voice chat for all participants
- More informal than Stage events
- Perfect for community hangouts`,

        EXTERNAL: `EXTERNAL EVENTS:
- Best for: Off-platform events (IRL meetups, Zoom calls, streams)
- Requires: Location text (URL or physical address)
- Requires: End time (unlike server-based events)
- Displays on server event list with external link
- Good for coordinating activities outside Discord`,
      };

      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text: `Welcome to the Event Creation Wizard!

Guild ID: ${guildId}
Selected Event Type: ${eventType}

${eventTypeGuides[eventType]}

EVENT CREATION STEPS:

1. CHOOSE EVENT LOCATION:
${
  eventType === "EXTERNAL"
    ? `   - Provide external location (URL or address)
   - Example: "https://zoom.us/j/123456789" or "Central Park, NYC"`
    : `   - Use list_channels to find available ${eventType === "STAGE_INSTANCE" ? "Stage" : "Voice"} channels
   - Create a new channel if needed using create_${eventType === "STAGE_INSTANCE" ? "stage" : "voice"}_channel`
}

2. SET EVENT DETAILS:
   - Name: Clear, descriptive title (max 100 characters)
   - Description: What to expect, who should attend, what to bring
   - Scheduled Start: ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
     Example: "2025-02-15T19:00:00.000Z" for Feb 15, 2025 at 7 PM UTC
${eventType === "EXTERNAL" ? "   - Scheduled End: Required for external events" : "   - Scheduled End: Optional for server events"}

3. CUSTOMIZE EVENT IMAGE (Optional):
   - Use modify_scheduled_event after creation
   - Upload cover image for better visibility
   - Images appear in event list and invitations

4. PROMOTE YOUR EVENT:
   - Create announcement using send_rich_message
   - Include event URL in announcement
   - Pin announcement in relevant channels
   - Share event link outside Discord

5. MANAGE INTERESTED USERS:
   - Use get_event_users to see who's interested
   - Send reminders before event starts
   - Use list to plan capacity

EVENT TIMING BEST PRACTICES:
- Schedule at least 24 hours in advance for better attendance
- Consider time zones for your community
- Avoid conflicts with other server events
- Set reminders 1 hour and 15 minutes before start

TIMEZONE CONVERSION:
Your local time must be converted to UTC (ISO 8601 format).
Use a tool like: https://www.timeanddate.com/worldclock/converter.html

Example: Creating a gaming tournament on Saturday at 3 PM EST:
- Start: "2025-02-15T20:00:00.000Z" (3 PM EST = 8 PM UTC)
- Name: "Weekend Gaming Tournament - Season 5"
- Description: "Join us for competitive matches! Prizes for top 3 players."

Available tools:
- list_channels: Find available voice/stage channels (for VOICE/STAGE events)
- create_voice_channel: Create new voice channel
- create_stage_channel: Create new stage channel
- create_scheduled_event: Create the event (MAIN TOOL)
- modify_scheduled_event: Update event details or add image
- list_scheduled_events: See all server events
- get_event_details: View specific event information
- get_event_users: See interested users list
- send_rich_message: Create event announcement
- create_invite: Generate server invite with event

REQUIRED INFORMATION FOR ${eventType} EVENT:
${
  eventType === "EXTERNAL"
    ? `- Event name
- Event description
- Location (URL or address)
- Scheduled start time (ISO 8601)
- Scheduled end time (ISO 8601) - REQUIRED`
    : `- Event name
- Event description
- Channel ID (${eventType === "STAGE_INSTANCE" ? "Stage" : "Voice"} channel)
- Scheduled start time (ISO 8601)
- Scheduled end time (optional)`
}

What event would you like to create?`,
            },
          },
        ],
      };
    },
  );
}
