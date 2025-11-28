---
layout: default
title: "Interactive Prompts - Discord Agent MCP"
description: "Guide to Discord Agent MCP's interactive prompts for server setup, moderation, events, and permissions auditing."
keywords: "Discord server setup wizard, Discord moderation assistant, Discord event creation, server template, community setup"
permalink: /prompts/
---

# Interactive Prompts

Discord Agent MCP includes **8 interactive prompts** that guide you through complex Discord management tasks. Prompts provide step-by-step assistance and suggest the right tools to use.

---

## What Are Prompts?

Prompts are pre-built workflows that:

- Guide you through multi-step operations
- Suggest best practices and templates
- Help you avoid common mistakes
- Make complex setups easier

Use prompts when you want guided assistance rather than direct tool calls.

---

## moderate-channel

**Purpose:** Interactive channel moderation assistant

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `guildId` | string | Server ID |
| `channelId` | string | Channel to moderate |
| `moderationLevel` | string | `light`, `standard`, or `strict` |

**What It Does:**

1. Reviews recent messages in the channel
2. Identifies potential violations based on moderation level
3. Suggests appropriate actions (warn, delete, timeout)
4. Helps you take action on flagged content

**Moderation Levels:**

- **Light**: Only flag obvious spam and explicit content
- **Standard**: Flag spam, inappropriate content, and heated arguments
- **Strict**: Flag any potentially problematic content

**Example Usage:**
```
"Help me moderate #general with standard moderation level"
```

---

## create-announcement

**Purpose:** Step-by-step announcement creation with rich formatting

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `channelId` | string | Target channel |
| `announcementType` | string | `update`, `event`, `notice`, or `alert` |

**What It Does:**

1. Suggests embed structure based on announcement type
2. Recommends colors and formatting
3. Helps craft the message content
4. Creates professional-looking announcements

**Announcement Types:**

| Type | Color | Use Case |
|------|-------|----------|
| `update` | Blue | New features, changes |
| `event` | Purple | Upcoming events, activities |
| `notice` | Yellow | Important information |
| `alert` | Red | Urgent warnings, critical info |

**Example Usage:**
```
"Create an event announcement for our game night in #announcements"
```

**Generated Format:**
```
📣 EVENT ANNOUNCEMENT

🎮 Game Night - Friday 8PM

Join us for community gaming! We'll be playing...

📅 When: Friday, 8:00 PM EST
📍 Where: Gaming Voice Channel
```

---

## setup-server

**Purpose:** Interactive wizard for organizing new server structure

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `guildId` | string | Server ID |
| `serverPurpose` | string | `community`, `gaming`, `project`, `education`, or `social` |

**What It Does:**

1. Analyzes your current server structure
2. Suggests categories and channels based on purpose
3. Recommends role hierarchy
4. Helps implement the suggested structure

**Server Templates:**

### Community Server
```
📋 INFORMATION
  ├── #welcome
  ├── #rules
  └── #announcements

💬 GENERAL
  ├── #general
  ├── #introductions
  └── #off-topic

❓ SUPPORT
  ├── #help
  └── #suggestions

🔊 VOICE
  ├── General Voice
  └── AFK
```

### Gaming Server
```
🎮 INFORMATION
  ├── #welcome
  ├── #rules
  └── #looking-for-group

💬 CHAT
  ├── #general
  ├── #game-discussion
  └── #clips-highlights

🎯 GAMES
  ├── #minecraft
  ├── #valorant
  └── #other-games

🔊 VOICE
  ├── Gaming 1
  ├── Gaming 2
  └── AFK
```

### Project/Work Server
```
📋 PROJECT INFO
  ├── #announcements
  ├── #resources
  └── #meeting-notes

💻 DEVELOPMENT
  ├── #dev-general
  ├── #code-review
  └── #bugs-issues

📊 PLANNING
  ├── #roadmap
  └── #discussion

📁 ARCHIVE
  └── #completed
```

### Education Server
```
📚 COURSE INFO
  ├── #syllabus
  ├── #announcements
  └── #resources

📝 CLASSROOM
  ├── #lecture-discussion
  ├── #homework-help
  └── #study-groups

🔊 VOICE
  ├── Lecture Hall
  ├── Study Room 1
  └── Office Hours
```

**Example Usage:**
```
"Set up my server as a gaming community"
```

---

## create-scheduled-event

**Purpose:** Guided event creation wizard

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `guildId` | string | Server ID |
| `eventType` | string | `STAGE_INSTANCE`, `VOICE`, or `EXTERNAL` |

**What It Does:**

1. Guides you through event details
2. Helps with date/time formatting
3. Suggests promotion strategies
4. Creates the event with proper settings

**Event Types:**

| Type | Best For | Requirements |
|------|----------|--------------|
| `STAGE_INSTANCE` | Presentations, Q&As | Stage channel |
| `VOICE` | Game nights, hangouts | Voice channel |
| `EXTERNAL` | Meetups, external streams | Location URL |

**Time Format Help:**
- Uses ISO 8601 format: `2024-03-15T20:00:00Z`
- Prompt helps convert natural language to proper format

**Example Usage:**
```
"Help me create a voice event for our weekly game night"
```

---

## configure-automod-rule

**Purpose:** Set up automatic moderation rules

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `guildId` | string | Server ID |

**What It Does:**

1. Explains available auto-mod triggers
2. Helps configure keywords and filters
3. Sets up appropriate actions
4. Tests the rule configuration

**Auto-Mod Triggers:**

| Trigger | Description |
|---------|-------------|
| `KEYWORD` | Block specific words or phrases |
| `SPAM` | Detect and block spam messages |
| `MENTION` | Prevent mass mentions (@everyone abuse) |
| `HARMFUL_LINKS` | Block malicious URLs |

**Actions:**

| Action | Effect |
|--------|--------|
| `BLOCK` | Delete the message |
| `ALERT_BLOCK` | Delete and alert moderators |
| `TIMEOUT` | Delete and timeout the user |

**Example Usage:**
```
"Help me set up auto-moderation to block spam and
inappropriate keywords"
```

---

## audit-permissions

**Purpose:** Security audit of server permissions

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `guildId` | string | Server ID |
| `scope` | string | `full`, `roles`, `channels`, or `members` |

**What It Does:**

1. Analyzes current permission structure
2. Identifies potential security risks
3. Provides risk ratings (HIGH/MEDIUM/LOW)
4. Suggests improvements

**Risk Categories:**

### HIGH Risk
- Too many users with Administrator
- Role management given to untrusted roles
- @everyone has dangerous permissions

### MEDIUM Risk
- Many users can manage channels
- Kick/ban permissions too widely distributed
- Webhook management accessible

### LOW Risk
- Minor permission inconsistencies
- Suboptimal role hierarchy

**Example Usage:**
```
"Audit my server's permission security"
```

**Sample Output:**
```
🔒 PERMISSION AUDIT RESULTS

⚠️ HIGH RISK (2 issues)
  - 5 roles have Administrator permission
  - @everyone can manage webhooks

⚡ MEDIUM RISK (3 issues)
  - 12 users can kick members
  - Role hierarchy allows escalation

✅ LOW RISK (1 issue)
  - Some channels have redundant overrides

RECOMMENDATIONS:
1. Reduce Administrator roles to 2 max
2. Remove webhook management from @everyone
3. Review kick permission distribution
```

---

## setup-welcome-automation

**Purpose:** Configure welcome messages and auto-roles

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `guildId` | string | Server ID |

**What It Does:**

1. Helps configure welcome channel
2. Sets up welcome message template
3. Configures auto-role assignment
4. Optional DM welcome message

**Welcome Message Templates:**

**Standard Welcome:**
```
👋 Welcome to {server}, {member}!

Please read our #rules and introduce yourself in #introductions.
```

**Gaming Community:**
```
🎮 {member} has joined the party!

Check out #looking-for-group to find teammates!
```

**Professional:**
```
Welcome to {server}, {member}.

Please review our guidelines in #rules and feel free to
introduce yourself in #general.
```

**Example Usage:**
```
"Set up welcome automation with auto-role for new members"
```

---

## Using Prompts Effectively

### When to Use Prompts

- **Complex setups** - Server organization, multi-step configurations
- **Unfamiliar tasks** - When you're not sure which tools to use
- **Best practices** - When you want guidance on Discord conventions
- **Bulk operations** - When you need to create many related items

### When to Use Direct Tools

- **Simple operations** - Send a message, create a channel
- **Specific tasks** - You know exactly what you need
- **Automation** - Scripted or repeated operations
- **Speed** - When you need quick execution

---

## Example Workflows

### New Server Setup

1. Use `setup-server` with your community type
2. Follow suggestions to create structure
3. Use `audit-permissions` to verify security
4. Use `setup-welcome-automation` for onboarding

### Event Planning

1. Use `create-scheduled-event` to create the event
2. Use `create-announcement` to promote it
3. Use tools directly for follow-up updates

### Moderation Overhaul

1. Use `audit-permissions` to identify issues
2. Use `configure-automod-rule` for automation
3. Use `moderate-channel` for active moderation

---

## Need Help?

- [All 71 Tools Reference]({{ '/tools/' | relative_url }})
- [Getting Started Guide]({{ '/getting-started/' | relative_url }})
- [Troubleshooting]({{ '/troubleshooting/' | relative_url }})
