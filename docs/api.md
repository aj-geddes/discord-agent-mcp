---
layout: default
title: "API Reference - Discord Agent MCP"
description: "Technical API reference for Discord Agent MCP. MCP protocol details, schemas, error handling, and integration guide."
keywords: "MCP API, Model Context Protocol, Discord API integration, MCP tools, JSON-RPC Discord"
permalink: /api/
---

# API Reference

Technical reference for integrating with Discord Agent MCP. Covers the MCP protocol, request/response formats, error handling, and schemas.

---

## Overview

Discord Agent MCP implements the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP), a standardized interface for AI assistants to interact with external tools and resources.

### Protocol Details

- **Protocol**: JSON-RPC 2.0
- **Transport**: HTTP (default) or stdio
- **Endpoint**: `/mcp` (HTTP mode)
- **Content-Type**: `application/json`

---

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "discord": "connected"
}
```

### MCP Endpoint

```
POST /mcp
Content-Type: application/json
Accept: application/json, text/event-stream
```

All MCP operations go through this endpoint using JSON-RPC 2.0 format.

---

## MCP Methods

### tools/list

List all available tools.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "send_message",
        "description": "Send a text message to a channel",
        "inputSchema": {
          "type": "object",
          "properties": {
            "channelId": { "type": "string" },
            "content": { "type": "string", "maxLength": 2000 }
          },
          "required": ["channelId", "content"]
        }
      }
      // ... 70 more tools
    ]
  }
}
```

### tools/call

Execute a tool.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "send_message",
    "arguments": {
      "channelId": "123456789012345678",
      "content": "Hello from MCP!"
    }
  }
}
```

**Response (Success):**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Message sent successfully to channel 123456789012345678"
      }
    ],
    "structuredContent": {
      "messageId": "987654321098765432",
      "channelId": "123456789012345678",
      "timestamp": "2024-01-15T10:30:00.000Z"
    },
    "isError": false
  }
}
```

**Response (Error):**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: Missing permission SEND_MESSAGES in channel 123456789012345678"
      }
    ],
    "isError": true
  }
}
```

### resources/list

List available resources.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "resources": [
      {
        "uri": "discord://guilds",
        "name": "Guild List",
        "description": "List of all guilds the bot is connected to",
        "mimeType": "application/json"
      }
    ]
  }
}
```

### resources/read

Read a resource.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "resources/read",
  "params": {
    "uri": "discord://guilds"
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "contents": [
      {
        "uri": "discord://guilds",
        "mimeType": "application/json",
        "text": "[{\"id\":\"123456789\",\"name\":\"My Server\",\"memberCount\":150}]"
      }
    ]
  }
}
```

### prompts/list

List available prompts.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "prompts/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "result": {
    "prompts": [
      {
        "name": "moderate-channel",
        "description": "Interactive channel moderation assistant",
        "arguments": [
          { "name": "guildId", "required": true },
          { "name": "channelId", "required": true },
          { "name": "moderationLevel", "required": false }
        ]
      }
      // ... more prompts
    ]
  }
}
```

### prompts/get

Get a prompt with arguments.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "prompts/get",
  "params": {
    "name": "setup-server",
    "arguments": {
      "guildId": "123456789012345678",
      "serverPurpose": "gaming"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "result": {
    "messages": [
      {
        "role": "user",
        "content": {
          "type": "text",
          "text": "Help me set up a gaming server structure..."
        }
      }
    ]
  }
}
```

---

## Data Types

### Snowflake IDs

Discord uses "snowflake" IDs - 17-19 digit numeric strings.

```typescript
// Valid snowflake
"123456789012345678"

// Pattern: 17-19 digits
/^\d{17,19}$/
```

### Timestamps

ISO 8601 format in UTC:

```
2024-01-15T10:30:00.000Z
```

### Colors

Hex color as integer (0-16777215):

```typescript
// Blue: 0x5865F2 = 5793266
// Red: 0xFF0000 = 16711680
// Green: 0x00FF00 = 65280
```

---

## Input Schemas

### Embed Object

```typescript
interface Embed {
  title?: string;        // max 256 chars
  description?: string;  // max 4096 chars
  url?: string;
  timestamp?: string;    // ISO 8601
  color?: number;        // 0-16777215
  footer?: {
    text: string;        // max 2048 chars
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;        // max 256 chars
    url?: string;
    icon_url?: string;
  };
  fields?: Array<{
    name: string;        // max 256 chars
    value: string;       // max 1024 chars
    inline?: boolean;
  }>;                    // max 25 fields
}
```

### Permission Names

Valid permission strings for role/channel operations:

```
Administrator
ViewChannel
ManageChannels
ManageRoles
ManageGuild
CreateInstantInvite
KickMembers
BanMembers
ManageNicknames
ChangeNickname
ManageWebhooks
ManageEmojisAndStickers
ManageEvents
ModerateMembers

SendMessages
SendMessagesInThreads
CreatePublicThreads
CreatePrivateThreads
EmbedLinks
AttachFiles
AddReactions
UseExternalEmojis
MentionEveryone
ManageMessages
ManageThreads
ReadMessageHistory

Connect
Speak
Stream
MuteMembers
DeafenMembers
MoveMembers
UseVAD
PrioritySpeaker
RequestToSpeak
```

---

## Error Handling

### Error Response Format

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Error: [ErrorType] - Description\n\nResolution: How to fix this"
      }
    ],
    "isError": true
  }
}
```

### Error Types

| Error | Description | Resolution |
|-------|-------------|------------|
| `DiscordNotConnectedError` | Bot not logged in | Check token, wait for connection |
| `PermissionDeniedError` | Missing permission | Grant permission in Discord |
| `ChannelNotFoundError` | Channel doesn't exist | Verify channel ID |
| `GuildNotFoundError` | Server not found | Verify guild ID, check membership |
| `MessageNotFoundError` | Message deleted/invalid | Verify message ID |
| `RateLimitError` | API rate limited | Wait and retry |
| `InvalidInputError` | Invalid parameter | Check input format |

### Rate Limiting

Discord API has rate limits. The server handles these automatically, but excessive requests may fail with `RateLimitError`.

**Rate Limit Response:**
```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error: Rate limit exceeded. Retry after 5000ms"
  }]
}
```

---

## Client Integration

### Node.js / TypeScript

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { HttpClientTransport } from "@modelcontextprotocol/sdk/client/http.js";

const client = new Client({
  name: "my-discord-client",
  version: "1.0.0"
});

// Connect via HTTP
const transport = new HttpClientTransport({
  url: "http://localhost:3000/mcp"
});
await client.connect(transport);

// List tools
const { tools } = await client.listTools();
console.log(`Found ${tools.length} tools`);

// Call a tool
const result = await client.callTool({
  name: "send_message",
  arguments: {
    channelId: "123456789012345678",
    content: "Hello from MCP client!"
  }
});

console.log(result.content[0].text);
```

### Python

```python
import httpx
import json

class MCPClient:
    def __init__(self, url: str):
        self.url = url
        self.request_id = 0

    def _request(self, method: str, params: dict = None) -> dict:
        self.request_id += 1
        payload = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": method
        }
        if params:
            payload["params"] = params

        response = httpx.post(
            f"{self.url}/mcp",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        return response.json()["result"]

    def list_tools(self) -> list:
        result = self._request("tools/list")
        return result["tools"]

    def call_tool(self, name: str, arguments: dict) -> dict:
        return self._request("tools/call", {
            "name": name,
            "arguments": arguments
        })

# Usage
client = MCPClient("http://localhost:3000")
tools = client.list_tools()
print(f"Found {len(tools)} tools")

result = client.call_tool("send_message", {
    "channelId": "123456789012345678",
    "content": "Hello from Python!"
})
print(result["content"][0]["text"])
```

### cURL

```bash
# List tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Call tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"send_message",
      "arguments":{
        "channelId":"123456789012345678",
        "content":"Hello from cURL!"
      }
    }
  }'
```

---

## Stdio Transport

For local process integration, use stdio transport:

### Configuration

```bash
TRANSPORT_MODE=stdio npm start
```

### Usage

The server reads JSON-RPC requests from stdin and writes responses to stdout. Each message is newline-delimited.

**Input (stdin):**
```json
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
```

**Output (stdout):**
```json
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}
```

### Claude Code Stdio Config

```json
{
  "mcpServers": {
    "discord-agent": {
      "type": "stdio",
      "command": "node",
      "args": ["dist/server/index.js"],
      "cwd": "/path/to/discord-agent-mcp",
      "env": {
        "DISCORD_TOKEN": "your_token",
        "TRANSPORT_MODE": "stdio"
      }
    }
  }
}
```

---

## Logging

### Log Format (JSON)

```json
{
  "level": "info",
  "message": "Tool executed",
  "tool": "send_message",
  "guildId": "123456789",
  "channelId": "987654321",
  "duration": 150,
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Log Levels

| Level | Description |
|-------|-------------|
| `error` | Errors only |
| `warn` | Warnings and errors |
| `info` | General info (default) |
| `debug` | Verbose debugging |

---

## Resources

- [Model Context Protocol Spec](https://spec.modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Discord API Documentation](https://discord.com/developers/docs)
- [Discord.js Guide](https://discordjs.guide/)
