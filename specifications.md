# Discord MCP Server - Technical Specifications
## The Golden Path to Production-Ready Discord Integration

**Version:** 2.0
**Status:** Recommended Architecture
**Last Updated:** 2025-01-21

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technical Requirements](#technical-requirements)
4. [API Specifications](#api-specifications)
5. [Implementation Guide](#implementation-guide)
6. [Security Considerations](#security-considerations)
7. [Performance and Scalability](#performance-and-scalability)
8. [Error Handling and Recovery](#error-handling-and-recovery)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Migration Guide](#migration-guide)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Options](#deployment-options)
13. [Roadmap and Future Enhancements](#roadmap-and-future-enhancements)

---

## Executive Summary

### Vision

The Discord MCP Server enables AI assistants to interact with Discord through a standardized, production-ready interface. This specification provides the architectural foundation for building a robust, scalable, and maintainable Discord integration using the Model Context Protocol.

### Key Goals

1. **Reliability**: Maintain persistent Discord connections with automatic recovery
2. **Developer Experience**: Provide intuitive, well-documented APIs with strong typing
3. **Security**: Protect bot tokens and enforce Discord's permission model
4. **Performance**: Handle high-throughput operations with proper rate limiting
5. **Observability**: Enable monitoring and debugging of bot operations

### Critical Architectural Decisions

This specification corrects fundamental flaws in previous implementations:

- **Session Management**: Discord client initialized once at server startup, not per tool call
- **Connection Lifecycle**: WebSocket connection persists throughout server lifetime
- **State Management**: Bot state maintained in-memory with optional persistence
- **Error Handling**: Comprehensive error types with actionable resolution guidance
- **Permission Model**: Dynamic tool availability based on bot permissions

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────┐
│                     MCP Client (Claude)                     │
│                 (via Claude Desktop / API)                  │
└────────────────────────┬────────────────────────────────────┘
                         │ JSON-RPC 2.0
                         │ (stdio or HTTP)
┌────────────────────────▼────────────────────────────────────┐
│                  MCP Server (TypeScript)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Server Core                             │  │
│  │  - McpServer instance                                │  │
│  │  - Transport management (stdio/HTTP)                 │  │
│  │  - Session lifecycle                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────┬──────────────┬──────────────┐           │
│  │    Tools     │  Resources   │   Prompts    │           │
│  │  - Messaging │  - Guilds    │  - Moderation│           │
│  │  - Channels  │  - Channels  │  - Announce  │           │
│  │  - Forums    │  - Messages  │  - Forums    │           │
│  │  - Webhooks  │  - Perms     │              │           │
│  └──────┬───────┴──────┬───────┴──────┬───────┘           │
│         │              │              │                    │
│  ┌──────▼──────────────▼──────────────▼───────────────┐   │
│  │           Discord Client Manager                    │   │
│  │  - Client instance (singleton)                      │   │
│  │  - Event listeners                                  │   │
│  │  - Connection state management                      │   │
│  │  - Automatic reconnection                           │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼──────────────────────────────────┘
                          │ WebSocket (Discord Gateway)
                          │ + REST API
┌─────────────────────────▼──────────────────────────────────┐
│                    Discord API                              │
│  - Gateway (WebSocket events)                               │
│  - REST API (operations)                                    │
│  - CDN (media)                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

#### MCP Server Core
- Manages transport connections (stdio or HTTP)
- Routes requests to appropriate handlers
- Maintains server capabilities and metadata
- Handles JSON-RPC protocol compliance

#### Discord Client Manager
- **Singleton Pattern**: One Discord client instance per server
- **Lifecycle**: Initialized at server startup, persists until shutdown
- **Event Handling**: Registers and manages Discord event listeners
- **State Tracking**: Caches guilds, channels, members for performance
- **Reconnection**: Automatic reconnection on disconnection with exponential backoff

#### Tools Layer
- Implements Discord operations as MCP tools
- Validates inputs using Zod schemas
- Checks permissions before execution
- Returns structured responses with error handling

#### Resources Layer
- Exposes Discord state as readable resources
- Uses URI templates for navigation
- Provides real-time snapshots of Discord data
- Enables context gathering without explicit tool calls

#### Prompts Layer
- Provides guided workflows for common operations
- Encodes Discord best practices
- Parameterized templates for reusability

---

## Technical Requirements

### Dependencies

#### Core Dependencies
```json
{
  "@modelcontextprotocol/sdk": "^1.0.0",
  "discord.js": "^14.14.0",
  "zod": "^3.22.0"
}
```

#### Development Dependencies
```json
{
  "typescript": "^5.3.0",
  "@types/node": "^20.0.0",
  "vitest": "^1.0.0",
  "prettier": "^3.1.0",
  "eslint": "^8.55.0"
}
```

### Environment Configuration

#### Required Environment Variables

```bash
# Discord Bot Token (required)
DISCORD_TOKEN=your_bot_token_here

# MCP Server Configuration
MCP_SERVER_NAME=discord-mcp-server
MCP_SERVER_VERSION=2.0.0

# Transport Configuration
TRANSPORT_MODE=stdio  # or 'http'
HTTP_PORT=3000        # if TRANSPORT_MODE=http

# Logging
LOG_LEVEL=info        # debug, info, warn, error
LOG_FORMAT=json       # json or pretty

# Discord Configuration
DISCORD_INTENTS=Guilds,GuildMessages,MessageContent,GuildMembers
RECONNECT_MAX_RETRIES=5
RECONNECT_BACKOFF_MS=1000

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=50

# Optional: Session Persistence
SESSION_STORE=memory  # memory or redis
REDIS_URL=redis://localhost:6379  # if SESSION_STORE=redis
```

### Discord Developer Portal Setup

#### 1. Application Configuration

Navigate to [Discord Developer Portal](https://discord.com/developers/applications)

1. Create new application
2. Navigate to "Bot" section
3. Click "Add Bot"
4. Copy bot token to `DISCORD_TOKEN` environment variable

#### 2. Privileged Gateway Intents (CRITICAL)

Enable the following intents in the Bot section:

- ✅ **Presence Intent** - Track user presence
- ✅ **Server Members Intent** - Access member information
- ✅ **Message Content Intent** - Read message content

**Note**: For verified bots (75+ servers), these require verification and approval.

#### 3. Bot Permissions

Recommended permission integer: `2147871808`

Individual permissions:
- ✅ View Channels (1024)
- ✅ Send Messages (2048)
- ✅ Send Messages in Threads (274877906944)
- ✅ Manage Messages (8192)
- ✅ Read Message History (65536)
- ✅ Add Reactions (64)
- ✅ Use External Emojis (262144)
- ✅ Manage Channels (16)
- ✅ Manage Threads (17179869184)
- ✅ Create Public Threads (34359738368)
- ✅ Manage Webhooks (536870912)
- ✅ Embed Links (16384)
- ✅ Attach Files (32768)

#### 4. OAuth2 URL Generation

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147871808&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your application's client ID.

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "removeComments": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

---

## API Specifications

### Tools

Tools enable AI assistants to perform actions in Discord. Each tool is defined with:
- **Name**: Unique identifier
- **Description**: Human-readable purpose
- **Input Schema**: Zod schema with validation
- **Output Schema**: Expected return structure
- **Handler**: Async function implementing the logic

#### Tool Categories

1. **Messaging Tools**
2. **Channel Management Tools**
3. **Forum Tools**
4. **Webhook Tools**
5. **Reaction Tools**
6. **Server Management Tools**

---

### 1. Messaging Tools

#### `send_message`

Sends a text message to a Discord channel.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID (snowflake) or name'),
  content: z.string()
    .max(2000)
    .describe('Message content'),
  reply: z.object({
    messageId: z.string(),
    mention: z.boolean().default(false)
  }).optional()
    .describe('Optional message to reply to'),
  embeds: z.array(embedSchema).max(10).optional()
    .describe('Optional embeds (max 10)'),
  files: z.array(fileSchema).max(10).optional()
    .describe('Optional file attachments (max 10)')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  messageId: z.string().optional(),
  channelId: z.string().optional(),
  timestamp: z.string().optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `SendMessages` in target channel
- `SendMessagesInThreads` if channel is a thread
- `EmbedLinks` if using embeds
- `AttachFiles` if including files

**Example Usage:**
```typescript
await tools.send_message({
  channelId: '123456789012345678',
  content: 'Hello from MCP!',
  embeds: [{
    title: 'System Status',
    description: 'All systems operational',
    color: 0x00ff00
  }]
});
```

**Error Handling:**
- `ChannelNotFoundError`: Channel ID invalid or not accessible
- `PermissionDeniedError`: Missing SendMessages permission
- `ContentTooLongError`: Message exceeds 2000 characters
- `RateLimitError`: Hit Discord rate limits

---

#### `read_messages`

Retrieves recent message history from a channel.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID or name'),
  limit: z.number()
    .int()
    .min(1)
    .max(100)
    .default(50)
    .describe('Number of messages to retrieve'),
  before: z.string().optional()
    .describe('Get messages before this message ID'),
  after: z.string().optional()
    .describe('Get messages after this message ID'),
  around: z.string().optional()
    .describe('Get messages around this message ID')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  messages: z.array(z.object({
    id: z.string(),
    content: z.string(),
    author: z.object({
      id: z.string(),
      username: z.string(),
      discriminator: z.string(),
      bot: z.boolean()
    }),
    timestamp: z.string(),
    editedTimestamp: z.string().nullable(),
    attachments: z.array(attachmentSchema),
    embeds: z.array(embedSchema),
    reactions: z.array(reactionSchema)
  })),
  hasMore: z.boolean(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ViewChannel`
- `ReadMessageHistory`

---

#### `delete_message`

Deletes a specific message.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID or name'),
  messageId: z.string()
    .describe('Message ID to delete'),
  reason: z.string().optional()
    .describe('Reason for deletion (audit log)')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  deletedMessageId: z.string().optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ManageMessages` (to delete others' messages)
- Bot can always delete its own messages

---

### 2. Channel Management Tools

#### `create_text_channel`

Creates a new text channel in a guild.

**Input Schema:**
```typescript
{
  guildId: z.string()
    .describe('Guild ID or name'),
  name: z.string()
    .min(1)
    .max(100)
    .regex(/^[\w-]+$/)
    .describe('Channel name (lowercase, hyphens, underscores)'),
  topic: z.string().max(1024).optional()
    .describe('Channel topic/description'),
  parent: z.string().optional()
    .describe('Parent category ID'),
  nsfw: z.boolean().default(false)
    .describe('Mark channel as NSFW'),
  rateLimitPerUser: z.number().int().min(0).max(21600).optional()
    .describe('Slowmode in seconds (0-21600)')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  channel: z.object({
    id: z.string(),
    name: z.string(),
    type: z.number(),
    position: z.number(),
    parentId: z.string().nullable()
  }).optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ManageChannels`

---

#### `delete_channel`

Permanently deletes a channel.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID to delete'),
  reason: z.string().optional()
    .describe('Reason for deletion (audit log)')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  deletedChannelId: z.string().optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ManageChannels`

**Warning**: This is a destructive operation. All messages are permanently deleted.

---

#### `modify_channel`

Modifies channel settings.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID to modify'),
  name: z.string().optional()
    .describe('New channel name'),
  topic: z.string().optional()
    .describe('New channel topic'),
  nsfw: z.boolean().optional()
    .describe('NSFW status'),
  rateLimitPerUser: z.number().optional()
    .describe('Slowmode in seconds'),
  parent: z.string().nullable().optional()
    .describe('New parent category ID'),
  reason: z.string().optional()
    .describe('Reason for modification')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  channel: channelSchema.optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ManageChannels`

---

### 3. Forum Tools

#### `get_forum_channels`

Lists all forum channels in a guild.

**Input Schema:**
```typescript
{
  guildId: z.string()
    .describe('Guild ID or name')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  forums: z.array(z.object({
    id: z.string(),
    name: z.string(),
    topic: z.string().nullable(),
    availableTags: z.array(z.object({
      id: z.string(),
      name: z.string(),
      emoji: z.string().nullable()
    })),
    defaultReactionEmoji: z.string().nullable(),
    rateLimitPerUser: z.number()
  })),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ViewChannel`

---

#### `create_forum_post`

Creates a new post in a forum channel.

**Input Schema:**
```typescript
{
  forumChannelId: z.string()
    .describe('Forum channel ID'),
  title: z.string()
    .min(1)
    .max(100)
    .describe('Post title'),
  content: z.string()
    .min(1)
    .max(2000)
    .describe('Initial message content'),
  tags: z.array(z.string()).max(5).optional()
    .describe('Tag IDs or names to apply'),
  files: z.array(fileSchema).optional()
    .describe('File attachments')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  post: z.object({
    threadId: z.string(),
    messageId: z.string(),
    title: z.string(),
    tags: z.array(z.string())
  }).optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `CreatePublicThreads`
- `SendMessagesInThreads`

---

#### `reply_to_forum_post`

Adds a reply to an existing forum post.

**Input Schema:**
```typescript
{
  threadId: z.string()
    .describe('Forum thread/post ID'),
  content: z.string()
    .max(2000)
    .describe('Reply content'),
  files: z.array(fileSchema).optional()
    .describe('File attachments')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  message: messageSchema.optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `SendMessagesInThreads`

---

#### `get_forum_post`

Retrieves details and messages from a forum post.

**Input Schema:**
```typescript
{
  threadId: z.string()
    .describe('Forum thread ID')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  post: z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    createdTimestamp: z.number(),
    archived: z.boolean(),
    locked: z.boolean(),
    appliedTags: z.array(z.string()),
    messages: z.array(messageSchema)
  }).optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ViewChannel`
- `ReadMessageHistory`

---

### 4. Webhook Tools

#### `create_webhook`

Creates a webhook for a channel.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID'),
  name: z.string()
    .min(1)
    .max(80)
    .describe('Webhook name'),
  avatar: z.string().optional()
    .describe('Avatar URL or base64 image'),
  reason: z.string().optional()
    .describe('Reason for creation')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  webhook: z.object({
    id: z.string(),
    token: z.string(),
    url: z.string(),
    name: z.string(),
    avatar: z.string().nullable(),
    channelId: z.string()
  }).optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ManageWebhooks`

**Security Note**: Webhook tokens are sensitive. Store securely and never expose publicly.

---

#### `send_webhook_message`

Sends a message through a webhook.

**Input Schema:**
```typescript
{
  webhookId: z.string()
    .describe('Webhook ID'),
  webhookToken: z.string()
    .describe('Webhook token'),
  content: z.string().max(2000).optional()
    .describe('Message content'),
  username: z.string().max(80).optional()
    .describe('Override webhook username'),
  avatarURL: z.string().url().optional()
    .describe('Override webhook avatar'),
  embeds: z.array(embedSchema).max(10).optional()
    .describe('Message embeds'),
  threadId: z.string().optional()
    .describe('Send to specific thread')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  messageId: z.string().optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- None (uses webhook authentication)

---

### 5. Reaction Tools

#### `add_reaction`

Adds an emoji reaction to a message.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID'),
  messageId: z.string()
    .describe('Message ID'),
  emoji: z.string()
    .describe('Unicode emoji or custom emoji format (name:id)')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `AddReactions`

**Emoji Formats:**
- Unicode: `👍`, `❤️`, `🎉`
- Custom: `customName:123456789012345678`
- Custom (by name): `:customName:`

---

#### `add_multiple_reactions`

Adds multiple reactions to a message sequentially.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID'),
  messageId: z.string()
    .describe('Message ID'),
  emojis: z.array(z.string())
    .min(1)
    .max(20)
    .describe('Array of emoji strings')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  addedCount: z.number().optional(),
  failedEmojis: z.array(z.string()).optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `AddReactions`

---

#### `remove_reaction`

Removes a reaction from a message.

**Input Schema:**
```typescript
{
  channelId: z.string()
    .describe('Channel ID'),
  messageId: z.string()
    .describe('Message ID'),
  emoji: z.string()
    .describe('Emoji to remove'),
  userId: z.string().optional()
    .describe('User ID whose reaction to remove (defaults to bot)')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ManageMessages` (to remove others' reactions)
- None (to remove own reactions)

---

### 6. Server Management Tools

#### `get_server_info`

Retrieves comprehensive guild information.

**Input Schema:**
```typescript
{
  guildId: z.string()
    .describe('Guild ID or name')
}
```

**Output Schema:**
```typescript
{
  success: z.boolean(),
  guild: z.object({
    id: z.string(),
    name: z.string(),
    ownerId: z.string(),
    memberCount: z.number(),
    channelCount: z.number(),
    roleCount: z.number(),
    icon: z.string().nullable(),
    description: z.string().nullable(),
    verificationLevel: z.number(),
    createdTimestamp: z.number(),
    channels: z.array(channelSchema),
    roles: z.array(roleSchema)
  }).optional(),
  error: z.string().optional()
}
```

**Required Permissions:**
- `ViewChannel`

---

### Resources

Resources provide read-only access to Discord state through URI patterns.

#### Resource URI Patterns

```
discord://guilds                              # List all guilds
discord://guild/{guildId}                     # Guild details
discord://guild/{guildId}/channels            # Guild channels
discord://guild/{guildId}/channel/{channelId} # Specific channel
discord://guild/{guildId}/members             # Guild members
discord://guild/{guildId}/roles               # Guild roles
discord://channel/{channelId}/messages        # Recent messages
discord://channel/{channelId}/permissions     # Bot permissions
discord://threads/active                      # Active threads
```

#### Example Resource Implementation

```typescript
server.registerResource(
  'guild-info',
  new ResourceTemplate('discord://guild/{guildId}', {
    list: 'discord://guilds'
  }),
  {
    title: 'Discord Guild Information',
    description: 'Detailed information about a Discord guild/server'
  },
  async (uri, { guildId }) => {
    const guild = await discordClient.guilds.fetch(guildId);

    return {
      contents: [{
        uri: uri.href,
        mimeType: 'application/json',
        text: JSON.stringify({
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
          channels: guild.channels.cache.map(ch => ({
            id: ch.id,
            name: ch.name,
            type: ch.type
          })),
          roles: guild.roles.cache.map(role => ({
            id: role.id,
            name: role.name,
            permissions: role.permissions.toArray()
          }))
        }, null, 2)
      }]
    };
  }
);
```

---

### Prompts

Prompts guide AI assistants through common Discord workflows.

#### `moderate-channel`

Guides moderation of a Discord channel.

**Arguments Schema:**
```typescript
{
  guildId: z.string().describe('Server to moderate'),
  channelId: z.string().describe('Channel to moderate'),
  moderationLevel: z.enum(['light', 'standard', 'strict'])
    .describe('Moderation strictness')
}
```

**Prompt Template:**
```
You are moderating the Discord channel "{channelName}" in server "{guildName}".

Moderation level: {moderationLevel}

Please follow these guidelines:
1. Review recent messages for policy violations
2. Check for spam, harassment, or inappropriate content
3. Use reactions to flag problematic messages
4. Delete messages that clearly violate rules
5. Document moderation actions in the mod log

Before taking any action:
- Verify you have ManageMessages permission
- Consider the context and user history
- Ensure actions align with server rules

Available tools:
- read_messages: Review recent channel history
- delete_message: Remove violating content
- add_reaction: Flag messages for review
- send_message: Post moderation notices

What would you like to do?
```

---

#### `create-announcement`

Guides creation of formatted announcements.

**Arguments Schema:**
```typescript
{
  channelId: z.string().describe('Announcement channel'),
  announcementType: z.enum(['update', 'event', 'notice', 'alert'])
    .describe('Type of announcement')
}
```

**Prompt Template:**
```
Create a professional Discord announcement in #{channelName}.

Announcement type: {announcementType}

Best practices:
1. Use embeds for better formatting
2. Include clear title and description
3. Add relevant emojis for visual appeal
4. Use color coding:
   - Updates: Blue (0x0099ff)
   - Events: Green (0x00ff00)
   - Notices: Yellow (0xffff00)
   - Alerts: Red (0xff0000)
5. Include timestamp or deadline if applicable
6. Add reaction options if seeking feedback

What is the content of your announcement?
```

---

## Implementation Guide

### Project Structure

```
discord-mcp-server/
├── src/
│   ├── server/
│   │   ├── index.ts           # Server entry point
│   │   ├── config.ts          # Configuration loader
│   │   └── transport.ts       # Transport factory
│   ├── discord/
│   │   ├── client.ts          # Discord client manager
│   │   ├── events.ts          # Event handlers
│   │   └── cache.ts           # State caching
│   ├── tools/
│   │   ├── messaging.ts       # Messaging tools
│   │   ├── channels.ts        # Channel management
│   │   ├── forums.ts          # Forum tools
│   │   ├── webhooks.ts        # Webhook tools
│   │   └── reactions.ts       # Reaction tools
│   ├── resources/
│   │   ├── guilds.ts          # Guild resources
│   │   ├── channels.ts        # Channel resources
│   │   └── permissions.ts     # Permission resources
│   ├── prompts/
│   │   ├── moderation.ts      # Moderation prompts
│   │   ├── announcements.ts   # Announcement prompts
│   │   └── forums.ts          # Forum prompts
│   ├── types/
│   │   ├── schemas.ts         # Zod schemas
│   │   └── discord.ts         # Discord type extensions
│   ├── errors/
│   │   ├── base.ts            # Base error classes
│   │   └── discord.ts         # Discord-specific errors
│   └── utils/
│       ├── logger.ts          # Logging utility
│       ├── validators.ts      # Input validators
│       └── retry.ts           # Retry logic
├── tests/
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── fixtures/              # Test fixtures
├── .env.example               # Example environment variables
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

### Core Implementation

#### 1. Discord Client Manager (`src/discord/client.ts`)

```typescript
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { Logger } from '../utils/logger.js';

export class DiscordClientManager {
  private client: Client | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectBackoffMs = 1000;

  constructor(
    private token: string,
    private logger: Logger
  ) {}

  async connect(): Promise<void> {
    if (this.connected) {
      this.logger.warn('Discord client already connected');
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions
      ]
    });

    this.setupEventHandlers();

    try {
      await this.client.login(this.token);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.logger.info('Discord client connected successfully');
    } catch (error) {
      this.logger.error('Failed to connect to Discord', { error });
      throw new Error(`Discord connection failed: ${error.message}`);
    }
  }

  private setupEventHandlers(): void {
    this.client!.once(Events.ClientReady, (readyClient) => {
      this.logger.info(`Logged in as ${readyClient.user.tag}`);
    });

    this.client!.on(Events.Error, (error) => {
      this.logger.error('Discord client error', { error });
    });

    this.client!.on(Events.Warn, (warning) => {
      this.logger.warn('Discord client warning', { warning });
    });

    this.client!.on(Events.Debug, (info) => {
      this.logger.debug('Discord debug info', { info });
    });

    // Handle disconnection
    this.client!.on(Events.ShardDisconnect, async () => {
      this.logger.warn('Discord client disconnected');
      this.connected = false;
      await this.attemptReconnect();
    });
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnect attempts reached');
      throw new Error('Discord reconnection failed');
    }

    this.reconnectAttempts++;
    const backoff = this.reconnectBackoffMs * Math.pow(2, this.reconnectAttempts - 1);

    this.logger.info(`Reconnect attempt ${this.reconnectAttempts} in ${backoff}ms`);

    await new Promise(resolve => setTimeout(resolve, backoff));

    try {
      await this.connect();
    } catch (error) {
      this.logger.error('Reconnection attempt failed', { error });
      await this.attemptReconnect();
    }
  }

  getClient(): Client {
    if (!this.client || !this.connected) {
      throw new Error('Discord client not connected. Call connect() first.');
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.connected = false;
      this.logger.info('Discord client disconnected');
    }
  }
}
```

#### 2. MCP Server Entry Point (`src/server/index.ts`)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { DiscordClientManager } from '../discord/client.js';
import { registerMessagingTools } from '../tools/messaging.js';
import { registerChannelTools } from '../tools/channels.js';
import { registerForumTools } from '../tools/forums.js';
import { registerGuildResources } from '../resources/guilds.js';
import { registerModerationPrompts } from '../prompts/moderation.js';
import { Logger } from '../utils/logger.js';
import { loadConfig } from './config.js';

async function main() {
  const config = loadConfig();
  const logger = new Logger(config.logLevel);

  // Initialize Discord client ONCE at startup
  const discordManager = new DiscordClientManager(
    config.discordToken,
    logger
  );

  try {
    await discordManager.connect();
  } catch (error) {
    logger.error('Failed to initialize Discord client', { error });
    process.exit(1);
  }

  // Create MCP server
  const mcpServer = new McpServer({
    name: config.serverName,
    version: config.serverVersion
  });

  // Register tools with Discord client injected
  registerMessagingTools(mcpServer, discordManager, logger);
  registerChannelTools(mcpServer, discordManager, logger);
  registerForumTools(mcpServer, discordManager, logger);

  // Register resources
  registerGuildResources(mcpServer, discordManager, logger);

  // Register prompts
  registerModerationPrompts(mcpServer);

  // Setup transport
  const transport = new StdioServerTransport();

  // Connect MCP server to transport
  await mcpServer.connect(transport);

  logger.info('MCP Server ready and connected');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Shutting down...');
    await discordManager.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('Shutting down...');
    await discordManager.disconnect();
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

#### 3. Example Tool Implementation (`src/tools/messaging.ts`)

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { DiscordClientManager } from '../discord/client.js';
import { Logger } from '../utils/logger.js';
import { z } from 'zod';
import { PermissionDeniedError, ChannelNotFoundError } from '../errors/discord.js';

export function registerMessagingTools(
  server: McpServer,
  discordManager: DiscordClientManager,
  logger: Logger
) {
  server.registerTool(
    'send_message',
    {
      title: 'Send Discord Message',
      description: 'Send a message to a Discord channel',
      inputSchema: {
        channelId: z.string().describe('Channel ID or name'),
        content: z.string().max(2000).describe('Message content'),
        embeds: z.array(z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          color: z.number().optional(),
          url: z.string().url().optional()
        })).max(10).optional()
      },
      outputSchema: {
        success: z.boolean(),
        messageId: z.string().optional(),
        error: z.string().optional()
      }
    },
    async ({ channelId, content, embeds }) => {
      try {
        const client = discordManager.getClient();

        // Resolve channel
        const channel = await client.channels.fetch(channelId);
        if (!channel || !channel.isTextBased()) {
          throw new ChannelNotFoundError(channelId);
        }

        // Check permissions
        if (channel.isThread() && !channel.permissionsFor(client.user!)?.has('SendMessagesInThreads')) {
          throw new PermissionDeniedError('SendMessagesInThreads', channelId);
        }
        if (!channel.permissionsFor(client.user!)?.has('SendMessages')) {
          throw new PermissionDeniedError('SendMessages', channelId);
        }

        // Send message
        const message = await channel.send({
          content,
          embeds: embeds || []
        });

        const output = {
          success: true,
          messageId: message.id,
          channelId: channel.id,
          timestamp: message.createdAt.toISOString()
        };

        logger.info('Message sent', { channelId, messageId: message.id });

        return {
          content: [{
            type: 'text',
            text: `Message sent successfully to ${channel.name}`
          }],
          structuredContent: output
        };
      } catch (error) {
        logger.error('Failed to send message', { error, channelId });

        const output = {
          success: false,
          error: error.message
        };

        return {
          content: [{
            type: 'text',
            text: `Failed to send message: ${error.message}`
          }],
          structuredContent: output,
          isError: true
        };
      }
    }
  );
}
```

---

## Security Considerations

### Token Protection

1. **Never commit tokens to version control**
   - Use `.env` files (add to `.gitignore`)
   - Use environment variables in production
   - Rotate tokens if exposed

2. **Token storage in production**
   - Use secret management systems (AWS Secrets Manager, HashiCorp Vault)
   - Encrypt at rest
   - Restrict access with IAM policies

3. **Token validation**
   ```typescript
   if (!process.env.DISCORD_TOKEN || process.env.DISCORD_TOKEN.length < 50) {
     throw new Error('Invalid DISCORD_TOKEN');
   }
   ```

### Permission Validation

Always check permissions before operations:

```typescript
async function checkPermissions(
  channel: TextChannel,
  client: Client,
  required: PermissionResolvable[]
): Promise<void> {
  const permissions = channel.permissionsFor(client.user!);

  for (const permission of required) {
    if (!permissions?.has(permission)) {
      throw new PermissionDeniedError(permission, channel.id);
    }
  }
}
```

### Input Sanitization

```typescript
function sanitizeMessageContent(content: string): string {
  // Remove potential mentions exploits
  return content
    .replace(/@everyone/g, '@\u200beveryone')
    .replace(/@here/g, '@\u200bhere')
    .slice(0, 2000); // Enforce length limit
}
```

### Rate Limit Protection

Implement client-side rate limiting:

```typescript
import { RateLimiter } from '../utils/rateLimiter.js';

const messageLimiter = new RateLimiter({
  windowMs: 5000,
  maxRequests: 5
});

async function sendMessage(channelId: string, content: string) {
  await messageLimiter.acquire(channelId);
  // ... send message
}
```

---

## Performance and Scalability

### Caching Strategy

Discord.js provides built-in caching. Configure appropriately:

```typescript
const client = new Client({
  intents: [...],
  makeCache: Options.cacheWithLimits({
    MessageManager: 100,      // Cache last 100 messages per channel
    GuildMemberManager: 200,  // Cache 200 members per guild
    UserManager: 100,         // Cache 100 users
    ThreadManager: 50         // Cache 50 threads
  })
});
```

### Memory Management

Monitor and limit cache sizes:

```typescript
// Periodic cache cleanup
setInterval(() => {
  client.channels.cache.sweep(
    channel => channel.type !== ChannelType.GuildText
  );

  client.guilds.cache.forEach(guild => {
    guild.members.cache.sweep(
      member => !member.voice.channel && Date.now() - member.joinedTimestamp > 86400000
    );
  });
}, 3600000); // Hourly
```

### Concurrent Request Handling

Use concurrency limits:

```typescript
import pLimit from 'p-limit';

const limit = pLimit(10); // Max 10 concurrent operations

async function sendBulkMessages(messages: Message[]) {
  await Promise.all(
    messages.map(msg =>
      limit(() => sendMessage(msg.channelId, msg.content))
    )
  );
}
```

---

## Error Handling and Recovery

### Custom Error Classes

```typescript
// src/errors/discord.ts

export class DiscordMCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public resolution?: string
  ) {
    super(message);
    this.name = 'DiscordMCPError';
  }
}

export class DiscordNotConnectedError extends DiscordMCPError {
  constructor() {
    super(
      'Discord client is not connected',
      'DISCORD_NOT_CONNECTED',
      'Ensure the bot is logged in before making requests'
    );
  }
}

export class PermissionDeniedError extends DiscordMCPError {
  constructor(permission: string, resourceId: string) {
    super(
      `Missing permission: ${permission} for resource ${resourceId}`,
      'PERMISSION_DENIED',
      `Grant the bot the '${permission}' permission in the Discord Developer Portal or server settings`
    );
  }
}

export class ChannelNotFoundError extends DiscordMCPError {
  constructor(channelId: string) {
    super(
      `Channel not found: ${channelId}`,
      'CHANNEL_NOT_FOUND',
      'Verify the channel ID is correct and the bot has access to it'
    );
  }
}

export class RateLimitError extends DiscordMCPError {
  constructor(retryAfter: number) {
    super(
      `Rate limited. Retry after ${retryAfter}ms`,
      'RATE_LIMITED',
      `Wait ${retryAfter}ms before retrying`
    );
    this.retryAfter = retryAfter;
  }
  retryAfter: number;
}
```

### Retry Logic

```typescript
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const isRetryable =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.httpStatus === 500 ||
        error.httpStatus === 502 ||
        error.httpStatus === 503;

      if (!isRetryable) throw error;

      const delay = backoffMs * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Monitoring and Observability

### Structured Logging

```typescript
// src/utils/logger.ts

export class Logger {
  constructor(private level: string) {}

  private log(level: string, message: string, metadata?: object) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata
    };

    console.log(JSON.stringify(entry));
  }

  info(message: string, metadata?: object) {
    this.log('info', message, metadata);
  }

  error(message: string, metadata?: object) {
    this.log('error', message, metadata);
  }

  warn(message: string, metadata?: object) {
    this.log('warn', message, metadata);
  }

  debug(message: string, metadata?: object) {
    if (this.level === 'debug') {
      this.log('debug', message, metadata);
    }
  }
}
```

### Metrics Collection

```typescript
export class Metrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(metric: string, value = 1) {
    this.counters.set(metric, (this.counters.get(metric) || 0) + value);
  }

  record(metric: string, value: number) {
    if (!this.histograms.has(metric)) {
      this.histograms.set(metric, []);
    }
    this.histograms.get(metric)!.push(value);
  }

  getSnapshot() {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => [
          k,
          {
            count: v.length,
            avg: v.reduce((a, b) => a + b, 0) / v.length,
            min: Math.min(...v),
            max: Math.max(...v)
          }
        ])
      )
    };
  }
}
```

### Health Checks

```typescript
export async function healthCheck(
  discordManager: DiscordClientManager
): Promise<{ status: string; details: object }> {
  const checks = {
    discord: false,
    latency: 0
  };

  try {
    checks.discord = discordManager.isConnected();
    checks.latency = discordManager.getClient().ws.ping;
  } catch (error) {
    // Connection check failed
  }

  const status = checks.discord ? 'healthy' : 'unhealthy';

  return { status, details: checks };
}
```

---

## Migration Guide

### From Current Implementation to Recommended Architecture

#### Step 1: Remove `discord_login` Tool

The current implementation incorrectly treats login as a tool. Remove it.

**Before:**
```typescript
server.registerTool('discord_login', ...);
```

**After:**
```typescript
// Initialize client at server startup
const discordManager = new DiscordClientManager(token, logger);
await discordManager.connect();
```

#### Step 2: Update Tool Handlers

Change from storing client in tool call to dependency injection.

**Before:**
```typescript
let client: Client | null = null;

server.registerTool('send_message', ..., async ({ channelId }) => {
  if (!client) throw new Error('Not logged in');
  // ...
});
```

**After:**
```typescript
function registerTools(server: McpServer, discordManager: DiscordClientManager) {
  server.registerTool('send_message', ..., async ({ channelId }) => {
    const client = discordManager.getClient();
    // ...
  });
}
```

#### Step 3: Update Docker Configuration

Ensure container stays running.

**Before (broken):**
```dockerfile
CMD ["node", "dist/index.js"]
# Container might restart per request
```

**After (correct):**
```dockerfile
CMD ["node", "dist/index.js"]
# Container runs continuously
# Health checks ensure it stays alive
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/tools/messaging.test.ts

import { describe, it, expect, vi } from 'vitest';
import { Client } from 'discord.js';
import { DiscordClientManager } from '../../../src/discord/client';

describe('send_message tool', () => {
  it('should send message successfully', async () => {
    const mockClient = {
      channels: {
        fetch: vi.fn().mockResolvedValue({
          isTextBased: () => true,
          send: vi.fn().mockResolvedValue({
            id: '123',
            createdAt: new Date()
          })
        })
      }
    };

    const manager = new DiscordClientManager('token', logger);
    manager.getClient = vi.fn().mockReturnValue(mockClient);

    const result = await sendMessageTool({ channelId: '123', content: 'test' });

    expect(result.structuredContent.success).toBe(true);
    expect(result.structuredContent.messageId).toBe('123');
  });

  it('should handle permission errors', async () => {
    // ... test permission denied scenario
  });
});
```

### Integration Tests

Requires a test Discord server.

```typescript
// tests/integration/messaging.test.ts

import { describe, it, beforeAll, afterAll } from 'vitest';

describe('Messaging Integration', () => {
  let server: McpServer;
  let testChannelId: string;

  beforeAll(async () => {
    // Setup test server and Discord connection
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should send and retrieve message', async () => {
    const sendResult = await server.callTool('send_message', {
      channelId: testChannelId,
      content: 'Integration test message'
    });

    expect(sendResult.success).toBe(true);

    const readResult = await server.callTool('read_messages', {
      channelId: testChannelId,
      limit: 1
    });

    expect(readResult.messages[0].content).toBe('Integration test message');
  });
});
```

---

## Deployment Options

### Option 1: Docker with stdio Transport

**Dockerfile:**
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
```

**Claude Desktop Config:**
```json
{
  "mcpServers": {
    "discord": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "-e",
        "DISCORD_TOKEN",
        "discord-mcp-server:latest"
      ],
      "env": {
        "DISCORD_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Option 2: HTTP Transport with Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  discord-mcp:
    build: .
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRANSPORT_MODE=http
      - HTTP_PORT=3000
      - LOG_LEVEL=info
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

### Option 3: Kubernetes Deployment

**deployment.yaml:**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: discord-mcp-server
spec:
  replicas: 1
  selector:
    matchLabels:
      app: discord-mcp
  template:
    metadata:
      labels:
        app: discord-mcp
    spec:
      containers:
      - name: server
        image: discord-mcp-server:latest
        env:
        - name: DISCORD_TOKEN
          valueFrom:
            secretKeyRef:
              name: discord-secrets
              key: token
        - name: TRANSPORT_MODE
          value: "http"
        ports:
        - containerPort: 3000
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
```

---

## Roadmap and Future Enhancements

### Phase 1: Foundation (Current)
- ✅ Core tool implementation
- ✅ Session management fixes
- ✅ Error handling improvements
- ✅ Documentation

### Phase 2: Advanced Features
- Voice channel support
- Stage channel management
- Advanced moderation (timeouts, bans, kicks)
- Scheduled events management
- Auto-moderation configuration

### Phase 3: Intelligence
- Message sentiment analysis
- Spam detection with ML
- Content moderation assistance
- User behavior analytics
- Automated response suggestions

### Phase 4: Scale
- Multi-bot support
- Sharding for large servers
- Redis-backed session persistence
- Distributed rate limiting
- Horizontal scaling

### Phase 5: Integration
- Integration with other MCP servers
- Webhook event streaming
- Real-time notifications to LLM
- Bi-directional context sharing
- Plugin system for extensions

---

## Appendices

### Appendix A: Complete Zod Schemas

```typescript
import { z } from 'zod';

export const snowflakeSchema = z.string().regex(/^\d{17,19}$/);

export const embedSchema = z.object({
  title: z.string().max(256).optional(),
  description: z.string().max(4096).optional(),
  url: z.string().url().optional(),
  color: z.number().int().min(0).max(0xffffff).optional(),
  timestamp: z.string().datetime().optional(),
  footer: z.object({
    text: z.string().max(2048),
    iconURL: z.string().url().optional()
  }).optional(),
  image: z.object({
    url: z.string().url()
  }).optional(),
  thumbnail: z.object({
    url: z.string().url()
  }).optional(),
  author: z.object({
    name: z.string().max(256),
    url: z.string().url().optional(),
    iconURL: z.string().url().optional()
  }).optional(),
  fields: z.array(z.object({
    name: z.string().max(256),
    value: z.string().max(1024),
    inline: z.boolean().optional()
  })).max(25).optional()
});

export const fileSchema = z.object({
  name: z.string(),
  attachment: z.string().describe('File path or URL'),
  description: z.string().max(1024).optional()
});

export const messageSchema = z.object({
  id: snowflakeSchema,
  content: z.string(),
  author: z.object({
    id: snowflakeSchema,
    username: z.string(),
    discriminator: z.string(),
    bot: z.boolean(),
    avatar: z.string().nullable()
  }),
  timestamp: z.string().datetime(),
  editedTimestamp: z.string().datetime().nullable(),
  attachments: z.array(z.object({
    id: snowflakeSchema,
    filename: z.string(),
    size: z.number(),
    url: z.string().url(),
    contentType: z.string().optional()
  })),
  embeds: z.array(embedSchema),
  reactions: z.array(z.object({
    emoji: z.string(),
    count: z.number(),
    me: z.boolean()
  }))
});

export const channelSchema = z.object({
  id: snowflakeSchema,
  name: z.string(),
  type: z.number(),
  position: z.number().optional(),
  topic: z.string().nullable().optional(),
  nsfw: z.boolean().optional(),
  parentId: snowflakeSchema.nullable().optional()
});

export const roleSchema = z.object({
  id: snowflakeSchema,
  name: z.string(),
  color: z.number(),
  position: z.number(),
  permissions: z.array(z.string()),
  managed: z.boolean(),
  mentionable: z.boolean()
});
```

### Appendix B: Discord Permission Constants

```typescript
export const DISCORD_PERMISSIONS = {
  ViewChannels: '1024',
  SendMessages: '2048',
  ReadMessageHistory: '65536',
  AddReactions: '64',
  ManageMessages: '8192',
  ManageChannels: '16',
  ManageThreads: '17179869184',
  CreatePublicThreads: '34359738368',
  SendMessagesInThreads: '274877906944',
  ManageWebhooks: '536870912',
  EmbedLinks: '16384',
  AttachFiles: '32768',
  UseExternalEmojis: '262144',
  Administrator: '8'
} as const;
```

### Appendix C: Rate Limit Reference

Discord rate limits per endpoint:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Send Message | 5 messages | 5 seconds |
| Delete Message | 5 deletes | 1 second |
| Add Reaction | 1 reaction | 0.25 seconds |
| Create Channel | 50 channels | 10 minutes |
| Edit Channel | 2 edits | 10 minutes |
| Create Webhook | 10 webhooks | 10 minutes |
| Global | 50 requests | 1 second |

### Appendix D: Troubleshooting Guide

#### Issue: DisallowedIntents Error

**Cause**: Privileged intents not enabled in Developer Portal

**Solution**:
1. Go to Discord Developer Portal
2. Navigate to Bot section
3. Enable required privileged intents
4. Restart bot

#### Issue: Missing Permissions Error

**Cause**: Bot lacks required permission in server/channel

**Solution**:
1. Check bot's role in server settings
2. Verify role has required permissions
3. Check channel-specific permission overwrites
4. Ensure bot role is above target roles (for role management)

#### Issue: Connection Timeout

**Cause**: Network issues or Discord API outage

**Solution**:
1. Check Discord status at status.discord.com
2. Verify network connectivity
3. Check firewall rules
4. Review reconnection logic in logs

---

## Conclusion

This specification provides a comprehensive, production-ready architecture for integrating Discord with the Model Context Protocol. By following these guidelines, developers can build reliable, secure, and performant Discord MCP servers that enable powerful AI-assisted Discord management.

**Key Takeaways:**

1. **Session Management is Critical**: Initialize Discord client once at server startup
2. **Leverage MCP SDK Patterns**: Use registerTool, registerResource, registerPrompt properly
3. **Security First**: Protect tokens, validate permissions, sanitize inputs
4. **Observability Matters**: Implement comprehensive logging and metrics
5. **Test Thoroughly**: Unit, integration, and end-to-end testing are essential

For questions, issues, or contributions, please refer to the project repository.

---

**Document Version**: 2.0
**Last Updated**: 2025-01-21
**Maintained By**: Discord MCP Server Project
**License**: MIT
