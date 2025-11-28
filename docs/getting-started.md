---
layout: default
title: "Getting Started - Discord Agent MCP"
description: "Step-by-step guide to set up Discord Agent MCP. Create a Discord bot, configure the MCP server, and connect to Claude AI in under 10 minutes."
keywords: "Discord bot setup, MCP server installation, Claude AI Discord integration, Discord automation setup"
permalink: /getting-started/
---

# Getting Started

Get Discord Agent MCP running in under 10 minutes. This guide walks you through creating a Discord bot, configuring the server, and connecting to Claude.

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js 20.0.0 or higher** - [Download Node.js](https://nodejs.org/)
- **A Discord account** - [Create one here](https://discord.com/)
- **A Discord server** where you have admin permissions
- **Claude Code CLI** (optional) - [Install Claude Code](https://claude.ai/claude-code)

---

## Step 1: Create a Discord Bot

First, create a Discord application and bot in the Discord Developer Portal.

### 1.1 Create Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"**
3. Enter a name (e.g., "My Server Bot") and click **Create**

### 1.2 Create Bot User

1. In the left sidebar, click **"Bot"**
2. Click **"Add Bot"** and confirm
3. Under the bot's username, click **"Reset Token"**
4. Copy the token and save it securely - you'll need this later

> **Important**: Never share your bot token publicly. Treat it like a password.

### 1.3 Enable Required Intents

Still on the Bot page, scroll down to **"Privileged Gateway Intents"** and enable:

- **Server Members Intent** - Required for member management
- **Message Content Intent** - Required for reading messages

Click **"Save Changes"**.

### 1.4 Invite Bot to Your Server

1. Go to **OAuth2 > URL Generator** in the sidebar
2. Under **Scopes**, select:
   - `bot`
   - `applications.commands`
3. Under **Bot Permissions**, select the permissions you need, or choose **Administrator** for full access:
   - Manage Channels
   - Manage Roles
   - Manage Messages
   - Read Messages/View Channels
   - Send Messages
   - Manage Threads
   - Moderate Members
4. Copy the generated URL at the bottom
5. Open the URL in your browser
6. Select your server and click **Authorize**

---

## Step 2: Install Discord Agent MCP

### 2.1 Clone the Repository

```bash
git clone https://github.com/aj-geddes/discord-agent-mcp.git
cd discord-agent-mcp
```

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your bot token:

```bash
DISCORD_TOKEN=your_bot_token_here
TRANSPORT_MODE=http
HTTP_PORT=3000
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2.4 Build and Start

```bash
# Build the TypeScript
npm run build

# Start the server
npm start
```

You should see:

```
{"level":"info","message":"Starting Discord MCP Server","version":"2.0.2"}
{"level":"info","message":"Discord client connected successfully"}
{"level":"info","message":"MCP Server running on http://localhost:3000/mcp"}
```

---

## Step 3: Connect to Claude Code

### Option A: CLI Command (Recommended)

With the server running, open a new terminal:

```bash
claude mcp add --transport http discord-agent http://localhost:3000/mcp
```

Verify the connection:

```bash
claude mcp list
# Should show: discord-agent: http://localhost:3000/mcp (HTTP)
```

### Option B: Project Configuration

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "discord-agent": {
      "type": "http",
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

---

## Step 4: Start Using It!

Open Claude Code and try these commands:

```
"List all channels in my server"
```

```
"Create a new text channel called #announcements"
```

```
"Send a welcome message to the general channel"
```

Claude will use the Discord Agent MCP tools to execute these actions on your server.

---

## Verify Everything Works

### Test the Health Endpoint

```bash
curl http://localhost:3000/health
```

Should return:

```json
{"status":"healthy","discord":"connected"}
```

### Test Tool Listing

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Should return a list of 71 tools.

---

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DISCORD_TOKEN` | Required | Your Discord bot token |
| `TRANSPORT_MODE` | `http` | `http` or `stdio` |
| `HTTP_PORT` | `3000` | Server port |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | `json` | `json` or `pretty` |

---

## Development Mode

For development with auto-reload:

```bash
npm run dev
```

The server will automatically restart when you make changes.

---

## Next Steps

- [Explore all 71 tools]({{ '/tools/' | relative_url }})
- [Learn about interactive prompts]({{ '/prompts/' | relative_url }})
- [Deploy to production]({{ '/deployment/' | relative_url }})
- [Troubleshoot issues]({{ '/troubleshooting/' | relative_url }})

---

## Common Setup Issues

### Bot Not Connecting

- Verify your `DISCORD_TOKEN` is correct in `.env`
- Check you haven't regenerated the token since copying it
- Ensure the bot has been invited to your server

### Tools Not Working

- Check the bot has the required permissions for the action
- Verify the bot's role is high enough in the role hierarchy
- Check server logs for specific error messages

### Claude Code Can't Connect

- Make sure the MCP server is running (`npm start`)
- Verify the URL is correct (`http://localhost:3000/mcp`)
- Try removing and re-adding the server in Claude Code

[Full Troubleshooting Guide →]({{ '/troubleshooting/' | relative_url }})
