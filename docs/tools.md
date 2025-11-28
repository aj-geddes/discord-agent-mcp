---
layout: default
title: "Tools Reference - Discord Agent MCP"
description: "Complete reference for all 71 Discord Agent MCP tools. Messaging, channels, roles, moderation, events, auto-mod, and slash command management."
keywords: "Discord MCP tools, Discord API tools, Discord bot commands, channel management, role management, Discord moderation tools"
permalink: /tools/
---

# Tools Reference

Discord Agent MCP provides **71 tools** for comprehensive Discord server management. This reference documents each tool with parameters, examples, and use cases.

---

## Messaging

**10 tools** for sending, editing, and managing messages.

### send_message

Send a text message to a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Target channel ID |
| `content` | string | Yes | Message text (max 2000 chars) |
| `embeds` | array | No | Embed objects (max 10) |

**Example:**
```
"Send 'Welcome to our server!' to channel 123456789"
```

---

### send_rich_message

Send formatted messages with embeds, images, and styling.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Target channel ID |
| `embeds` | array | Yes | Array of embed objects |

**Embed Object:**
- `title` - Embed title (max 256 chars)
- `description` - Embed body (max 4096 chars)
- `color` - Hex color integer (0-0xFFFFFF)
- `footer` - Footer text
- `fields` - Array of field objects
- `image` - Image URL
- `thumbnail` - Thumbnail URL

**Example:**
```
"Create an announcement embed with title 'Server Update',
description about new features, and blue color"
```

---

### send_message_with_file

Send a message with file attachments.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Target channel ID |
| `content` | string | No | Message text |
| `file` | string | Yes | File path or URL |
| `description` | string | No | Alt text (max 1024 chars) |

---

### read_messages

Retrieve message history from a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `limit` | number | No | Number of messages (1-100, default 50) |
| `before` | string | No | Get messages before this ID |
| `after` | string | No | Get messages after this ID |

**Returns:** Array of messages with author, content, attachments, embeds, and reactions.

---

### edit_message

Edit an existing message sent by the bot.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `messageId` | string | Yes | Message to edit |
| `newContent` | string | Yes | New message content |
| `embeds` | array | No | New embeds |

---

### delete_message

Delete a specific message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `messageId` | string | Yes | Message to delete |
| `reason` | string | No | Audit log reason |

---

### bulk_delete_messages

Delete multiple messages at once (up to 100, messages must be < 14 days old).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `limit` | number | Yes | Number to delete (2-100) |
| `userId` | string | No | Filter by author |
| `bots` | boolean | No | Filter bot messages only |
| `reason` | string | No | Audit log reason |

**Example:**
```
"Delete the last 50 messages from bots in #spam-channel"
```

---

### add_reaction

Add an emoji reaction to a message.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `messageId` | string | Yes | Message ID |
| `emoji` | string | Yes | Unicode emoji or custom emoji ID |

---

### pin_message

Pin a message to a channel (max 50 pins per channel).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `messageId` | string | Yes | Message to pin |
| `reason` | string | No | Audit log reason |

---

### unpin_message

Unpin a message from a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | Channel ID |
| `messageId` | string | Yes | Message to unpin |
| `reason` | string | No | Audit log reason |

---

## Channel Management

**10 tools** for creating and managing channels.

### list_channels

Get all channels in a server.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `type` | string | No | Filter by type (text, voice, category, etc.) |

**Returns:** Channels organized by type with ID, name, topic, position, and parent category.

---

### get_channel_details

Get detailed information about a specific channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Channel ID |

**Returns:** Full channel metadata including permissions, slowmode settings, NSFW flag, etc.

---

### create_text_channel

Create a new text channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Channel name |
| `topic` | string | No | Channel topic |
| `parent` | string | No | Category ID |
| `nsfw` | boolean | No | Mark as NSFW |

**Example:**
```
"Create a text channel called 'project-updates' in the
'Work' category with topic 'Daily project status updates'"
```

---

### create_voice_channel

Create a new voice channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Channel name |
| `bitrate` | number | No | Audio bitrate (8000-96000) |
| `userLimit` | number | No | Max users (0 = unlimited) |
| `parent` | string | No | Category ID |

---

### create_category

Create a channel category for organization.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Category name |

---

### create_forum_channel

Create a forum channel for threaded discussions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Forum name |
| `topic` | string | No | Forum guidelines |
| `tags` | array | No | Available tags |
| `slowmode` | number | No | Slowmode in seconds |

---

### create_stage_channel

Create a stage channel for presentations and events.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Stage name |
| `topic` | string | No | Stage topic |
| `parent` | string | No | Category ID |

---

### modify_channel

Update channel settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Channel ID |
| `name` | string | No | New name |
| `topic` | string | No | New topic |
| `slowmode` | number | No | Slowmode in seconds |
| `nsfw` | boolean | No | NSFW flag |
| `parent` | string | No | New category |
| `reason` | string | No | Audit log reason |

---

### delete_channel

Permanently delete a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Channel ID |
| `reason` | string | No | Audit log reason |

---

### set_channel_permissions

Configure channel-specific permission overrides.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Channel ID |
| `targetId` | string | Yes | Role or user ID |
| `allow` | array | No | Permissions to allow |
| `deny` | array | No | Permissions to deny |

**Example:**
```
"Make #announcements read-only for @everyone but allow
Moderators to send messages"
```

---

## Thread Management

**3 tools** for managing forum threads and discussions.

### find_threads

Search for threads in a forum channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Forum channel ID |
| `query` | string | No | Search by name |

---

### create_thread

Create a new thread in a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Parent channel ID |
| `threadName` | string | Yes | Thread title |
| `message` | string | No | Initial message |

---

### archive_thread

Archive and lock a thread.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Parent channel ID |
| `threadId` | string | Yes | Thread ID |
| `reason` | string | No | Audit log reason |

---

## Server Management

**7 tools** for server configuration and administration.

### get_server_info

Get comprehensive server information.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

**Returns:** Name, description, owner, member count, features, icon URL, creation date, and more.

---

### modify_server

Update server settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | No | New server name |
| `description` | string | No | New description |
| `reason` | string | No | Audit log reason |

---

### get_audit_logs

Retrieve server audit log entries.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `actionType` | string | No | Filter by action type |
| `userId` | string | No | Filter by user |
| `limit` | number | No | Number of entries |

**Returns:** Actions with executor, target, changes, and timestamps.

---

### list_webhooks

List all webhooks in the server.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | No | Filter by channel |

---

### create_webhook

Create a new webhook for a channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Target channel |
| `name` | string | Yes | Webhook name |
| `avatar` | string | No | Avatar URL |

---

### get_invites

List all active invite links.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

**Returns:** Invites with code, channel, creator, uses, and expiration.

---

### create_invite

Create a new invite link.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `channelId` | string | Yes | Target channel |
| `maxAge` | number | No | Expiration in seconds (0 = never) |
| `maxUses` | number | No | Max uses (0 = unlimited) |
| `temporary` | boolean | No | Grant temporary membership |

---

## Member Management

**3 tools** for managing server members.

### get_member_info

Get detailed information about a member.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |

**Returns:** Username, avatar, join date, roles, nickname, status.

---

### list_members

List all members with optional filtering.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `limit` | number | No | Max results |
| `role` | string | No | Filter by role ID |
| `joinedBefore` | string | No | Filter by join date |
| `joinedAfter` | string | No | Filter by join date |

---

### set_nickname

Change a member's server nickname.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `newNickname` | string | Yes | New nickname |
| `reason` | string | No | Audit log reason |

---

## Role Management

**7 tools** for creating and managing roles.

### list_roles

List all roles in the server.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

**Returns:** Roles with ID, name, color, position, permissions, and mentionable status.

---

### get_role_info

Get detailed information about a specific role.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `roleId` | string | Yes | Role ID |

---

### create_role

Create a new role with permissions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Role name |
| `color` | number | No | Hex color integer |
| `hoist` | boolean | No | Display separately |
| `mentionable` | boolean | No | Allow mentions |
| `permissions` | array | No | Permission names |
| `reason` | string | No | Audit log reason |

**Example:**
```
"Create a 'Moderator' role with blue color, displayed
separately, with permissions to manage messages and kick members"
```

---

### modify_role

Update role settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `roleId` | string | Yes | Role ID |
| `name` | string | No | New name |
| `color` | number | No | New color |
| `hoist` | boolean | No | Display separately |
| `mentionable` | boolean | No | Allow mentions |
| `permissions` | array | No | New permissions |
| `reason` | string | No | Audit log reason |

---

### delete_role

Delete a role.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `roleId` | string | Yes | Role ID |
| `reason` | string | No | Audit log reason |

---

### assign_role

Add a role to a member.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `roleId` | string | Yes | Role ID |
| `reason` | string | No | Audit log reason |

---

### remove_role

Remove a role from a member.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `roleId` | string | Yes | Role ID |
| `reason` | string | No | Audit log reason |

---

## Moderation

**6 tools** for moderating members.

### kick_member

Remove a member from the server (they can rejoin).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `reason` | string | No | Audit log reason |

---

### ban_member

Ban a member from the server.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `deleteMessageDays` | number | No | Delete message history (0-7 days) |
| `reason` | string | No | Audit log reason |

---

### unban_member

Remove a ban.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `reason` | string | No | Audit log reason |

---

### timeout_member

Temporarily mute a member.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `durationMs` | number | Yes | Duration in milliseconds |
| `reason` | string | No | Audit log reason |

**Example:**
```
"Timeout user 123456789 for 1 hour for spamming"
```

---

### remove_timeout

Remove a timeout from a member.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `userId` | string | Yes | User ID |
| `reason` | string | No | Audit log reason |

---

### get_bans

List all banned users.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

**Returns:** Banned users with usernames and ban reasons.

---

## Emoji Management

**4 tools** for managing custom emojis.

### list_guild_emojis

Get all custom emojis for a server.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

**Returns:** Emojis with ID, name, animated status, and role restrictions.

---

### create_emoji

Upload a custom emoji.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Emoji name |
| `image` | string | Yes | Base64 data or file path |
| `roleIds` | array | No | Restrict to roles |

---

### modify_emoji

Update emoji settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `emojiId` | string | Yes | Emoji ID |
| `name` | string | No | New name |
| `roleIds` | array | No | New role restrictions |

---

### delete_emoji

Delete a custom emoji.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `emojiId` | string | Yes | Emoji ID |

---

## Sticker Management

**4 tools** for managing custom stickers.

### list_guild_stickers

Get all custom stickers for a server.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

---

### create_sticker

Upload a custom sticker (PNG, APNG, or Lottie).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Sticker name |
| `file` | string | Yes | File path |
| `description` | string | No | Sticker description |
| `tags` | string | No | Related emoji |

---

### modify_sticker

Update sticker settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `stickerId` | string | Yes | Sticker ID |
| `name` | string | No | New name |
| `description` | string | No | New description |
| `tags` | string | No | New tags |

---

### delete_sticker

Delete a custom sticker.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `stickerId` | string | Yes | Sticker ID |

---

## Scheduled Events

**6 tools** for managing server events.

### list_scheduled_events

Get all scheduled events.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `withUserCount` | boolean | No | Include interested count |

---

### get_event_details

Get detailed information about an event.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `eventId` | string | Yes | Event ID |

---

### create_scheduled_event

Create a new scheduled event.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Event name |
| `description` | string | No | Event description |
| `scheduledStartTime` | string | Yes | ISO 8601 start time |
| `entityType` | string | Yes | STAGE_INSTANCE, VOICE, or EXTERNAL |
| `channelId` | string | Conditional | Required for stage/voice |
| `location` | string | Conditional | Required for external |
| `scheduledEndTime` | string | No | ISO 8601 end time |
| `image` | string | No | Cover image URL |

**Example:**
```
"Create a voice event called 'Game Night' in the Gaming
voice channel for Saturday at 8 PM"
```

---

### modify_scheduled_event

Update event details.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `eventId` | string | Yes | Event ID |
| `name` | string | No | New name |
| `description` | string | No | New description |
| `status` | string | No | SCHEDULED, ACTIVE, COMPLETED, CANCELLED |
| `scheduledStartTime` | string | No | New start time |
| `scheduledEndTime` | string | No | New end time |

---

### delete_scheduled_event

Delete or cancel an event.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `eventId` | string | Yes | Event ID |

---

### get_event_users

Get users interested in an event.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `eventId` | string | Yes | Event ID |
| `limit` | number | No | Max results |

---

## Auto-Moderation

**5 tools** for automatic moderation rules.

### list_automod_rules

Get all auto-moderation rules.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |

---

### get_automod_rule

Get details about a specific rule.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `ruleId` | string | Yes | Rule ID |

---

### create_automod_rule

Create an auto-moderation rule.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `name` | string | Yes | Rule name |
| `triggerType` | string | Yes | KEYWORD, SPAM, MENTION, HARMFUL_LINKS |
| `eventType` | string | Yes | MESSAGE_SEND |
| `actions` | array | Yes | BLOCK, ALERT_BLOCK, TIMEOUT |
| `keywords` | array | No | Trigger keywords |
| `keywordFilter` | string | No | Preset filter |
| `exemptRoles` | array | No | Bypass roles |
| `exemptChannels` | array | No | Bypass channels |
| `reason` | string | No | Audit log reason |

**Example:**
```
"Create an auto-mod rule to block messages containing
spam keywords and timeout the user for 5 minutes"
```

---

### modify_automod_rule

Update rule settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `ruleId` | string | Yes | Rule ID |
| `enabled` | boolean | No | Enable/disable |
| `name` | string | No | New name |
| `triggerMetadata` | object | No | New triggers |
| `actions` | array | No | New actions |

---

### delete_automod_rule

Delete an auto-moderation rule.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | Yes | Server ID |
| `ruleId` | string | Yes | Rule ID |

---

## Application Commands

**6 tools** for managing slash commands.

### list_application_commands

List all slash commands.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `guildId` | string | No | Server ID (omit for global) |

---

### get_application_command

Get details about a specific command.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandId` | string | Yes | Command ID |
| `guildId` | string | No | Server ID (omit for global) |

---

### create_application_command

Create a new slash command.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Command name |
| `description` | string | Yes | Command description |
| `type` | string | No | CHAT_INPUT, USER, MESSAGE |
| `options` | array | No | Command options |
| `defaultMemberPermissions` | string | No | Required permissions |
| `dmPermission` | boolean | No | Allow in DMs |
| `guildId` | string | No | Server ID (omit for global) |

---

### modify_application_command

Update command settings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandId` | string | Yes | Command ID |
| `name` | string | No | New name |
| `description` | string | No | New description |
| `options` | array | No | New options |
| `guildId` | string | No | Server ID (omit for global) |

---

### delete_application_command

Delete a slash command.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandId` | string | Yes | Command ID |
| `guildId` | string | No | Server ID (omit for global) |

---

### bulk_overwrite_commands

Replace all commands at once.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commands` | array | Yes | Array of command definitions |
| `guildId` | string | No | Server ID (omit for global) |

---

## Resources

### discord://guilds

List all servers the bot is connected to.

**Usage:** Access through MCP resource protocol.

**Returns:** JSON array of guilds with ID, name, member count, and owner ID.

---

## Need Help?

- [Getting Started Guide]({{ '/getting-started/' | relative_url }})
- [Interactive Prompts]({{ '/prompts/' | relative_url }})
- [Troubleshooting]({{ '/troubleshooting/' | relative_url }})
- [GitHub Issues](https://github.com/aj-geddes/discord-agent-mcp/issues)
