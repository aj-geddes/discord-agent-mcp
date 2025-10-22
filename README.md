# Discord MCP Server

Production-ready Model Context Protocol (MCP) server for AI-assisted Discord management and automation. Provides 46+ tools for comprehensive Discord API integration through the MCP protocol.

## Features

- **46+ Discord Tools**: Complete API coverage for messaging, channels, threads, roles, members, and moderation
- **MCP Protocol Compliant**: Full implementation of Model Context Protocol for AI assistant integration
- **Persistent Connection**: Robust Discord.js client with automatic reconnection
- **Production Ready**: TypeScript, comprehensive error handling, structured logging
- **Flexible Deployment**: Run locally, in Docker, or Kubernetes
- **Multiple Transports**: HTTP and stdio modes supported
- **Claude Code Native**: First-class integration with Anthropic's Claude Code CLI

## Table of Contents

- [Getting Started](#getting-started)
- [Discord Bot Setup](#discord-bot-setup)
- [Local Usage](#local-usage)
- [Claude Code Integration](#claude-code-integration)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Available Tools](#available-tools)
- [Configuration](#configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- **Node.js >= 20.0.0**
- **Discord Bot Token** - See [Discord Bot Setup](#discord-bot-setup)
- **npm or yarn** for dependency management

### Quick Clone and Run

```bash
# Clone the repository
git clone https://github.com/aj-geddes/discord-agent-mcp.git
cd discord-agent-mcp

# Install dependencies
npm install

# Create your configuration
cp .env.example .env
# Edit .env and add your DISCORD_TOKEN

# Build the project
npm run build

# Start the MCP server
npm start
```

The server will start on `http://localhost:3000` by default.

## Discord Bot Setup

Before using this MCP server, you need to create a Discord bot and invite it to your server.

### 1. Create a Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. Navigate to the **"Bot"** section in the left sidebar
4. Click **"Add Bot"** and confirm

### 2. Get Your Bot Token

1. In the **Bot** section, click **"Reset Token"** to generate a new token
2. **Copy this token** - you'll need it for your `.env` file
3. ⚠️ **Never share this token publicly** - treat it like a password

### 3. Configure Bot Permissions

In the **Bot** section, enable these **Privileged Gateway Intents**:
- ✅ **Presence Intent** (optional - for member status)
- ✅ **Server Members Intent** (required - for member management)
- ✅ **Message Content Intent** (required - for reading messages)

### 4. Invite Bot to Your Server

1. Go to the **OAuth2 > URL Generator** section
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select bot permissions (or choose **Administrator** for full access):
   - Manage Channels
   - Manage Roles
   - Manage Messages
   - Read Messages/View Channels
   - Send Messages
   - Manage Threads
   - Moderate Members
4. Copy the generated URL and open it in your browser
5. Select your server and click **Authorize**

### 5. Configure Your Environment

```bash
# In your discord-agent-mcp directory
cp .env.example .env
```

Edit `.env` and add your token:
```bash
DISCORD_TOKEN=your_bot_token_here
TRANSPORT_MODE=http
HTTP_PORT=3000
LOG_LEVEL=info
LOG_FORMAT=json
```

## Local Usage

### Running the Server Locally

The MCP server can run directly on your machine without Docker or Kubernetes.

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm run build
npm start
```

The server will log its startup:
```
{"level":"info","message":"Starting Discord MCP Server","version":"2.0.0","transportMode":"http"}
{"level":"info","message":"Discord client connected successfully"}
{"level":"info","message":"MCP Server running on http://localhost:3000/mcp"}
```

### Testing the Server

```bash
# Health check
curl http://localhost:3000/health

# List available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq
```

### Using with Any MCP Client

The server implements the standard MCP protocol and works with any MCP-compatible client:

```javascript
// Example: Using with MCP client library
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const client = new Client({
  name: "my-discord-client",
  version: "1.0.0"
});

await client.connect({
  url: "http://localhost:3000/mcp",
  transport: "http"
});

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: "send_message",
  arguments: {
    channelId: "your-channel-id",
    content: "Hello from MCP!"
  }
});
```

## Claude Code Integration

### Setup with Claude Code CLI

1. **Start the MCP server locally:**
   ```bash
   npm start
   # Server runs at http://localhost:3000/mcp
   ```

2. **Add the server to Claude Code:**
   ```bash
   claude mcp add --transport http discord-agent http://localhost:3000/mcp
   ```

3. **Verify the connection:**
   ```bash
   claude mcp list
   # Should show: discord-agent: http://localhost:3000/mcp (HTTP)
   ```

4. **Use in Claude Code:**
   - Open Claude Code
   - Type `/mcp` to see available servers
   - All 46+ Discord tools are now available with `mcp__discord-agent__` prefix

### Alternative: Project-Specific Configuration

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

### Example Usage in Claude Code

Once configured, you can use Discord tools directly in Claude Code conversations:

```
You: "Send a message to channel 123456789 saying 'Hello team!'"

Claude: I'll use the discord-agent MCP server to send that message.
[Uses mcp__discord-agent__send_message tool]

Claude: ✅ Message sent successfully to channel 123456789
```

```
You: "List all channels in the server"

Claude: Let me get the server channels for you.
[Uses mcp__discord-agent__list_channels tool]

Claude: Found 25 channels:
- 📢 announcements (text)
- 💬 general (text)
- 🗣️ voice-chat (voice)
...
```

## Docker Deployment

### Build and Run with Docker

```bash
# Build the image
docker build -t discord-mcp-server:latest .

# Run the container
docker run -d \
  --name discord-mcp \
  -p 3000:3000 \
  -e DISCORD_TOKEN=your_token_here \
  discord-mcp-server:latest

# Check logs
docker logs -f discord-mcp

# Stop the container
docker stop discord-mcp
```

### Using Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  discord-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRANSPORT_MODE=http
      - HTTP_PORT=3000
      - LOG_LEVEL=info
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (K3s, K3d, minikube, or cloud provider)
- `kubectl` configured

### Deploy to Kubernetes

1. **Build and load the image** (for local clusters like K3d):
   ```bash
   docker build -t discord-mcp-server:latest .
   k3d image import discord-mcp-server:latest -c your-cluster-name
   ```

2. **Create the secret with your bot token:**
   ```bash
   cp k8s/secret.yaml.example k8s/secret.yaml
   # Edit k8s/secret.yaml and replace YOUR_DISCORD_BOT_TOKEN_HERE
   ```

3. **Deploy to the cluster:**
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```

4. **Verify the deployment:**
   ```bash
   kubectl get pods -n discord-agent-mcp
   kubectl logs -n discord-agent-mcp -l app=discord-mcp-server -f
   ```

5. **Access the server:**
   ```bash
   # Port-forward to localhost
   kubectl port-forward -n discord-agent-mcp svc/discord-mcp-server 3000:3000

   # Test the connection
   curl http://localhost:3000/health
   ```

## Available Tools (46+)

### Messaging (10 tools)
- `send_message` - Send a text message to a channel
- `send_rich_message` - Send formatted embeds with images and styling
- `send_message_with_file` - Send a message with file attachments
- `read_messages` - Retrieve message history from a channel
- `edit_message` - Edit an existing message
- `delete_message` - Delete a specific message
- `bulk_delete_messages` - Delete multiple messages at once (up to 100)
- `add_reaction` - Add emoji reactions to messages
- `pin_message` - Pin important messages
- `unpin_message` - Unpin messages

### Channel Management (10 tools)
- `list_channels` - List all channels in a server
- `get_channel_details` - Get detailed channel information
- `create_text_channel` - Create a new text channel
- `create_voice_channel` - Create a new voice channel
- `create_category` - Create a category to organize channels
- `create_forum_channel` - Create a forum channel for discussions
- `create_stage_channel` - Create a stage channel for events
- `modify_channel` - Update channel settings (name, topic, slowmode)
- `delete_channel` - Delete a channel
- `set_channel_permissions` - Configure channel-specific permissions

### Thread Management (3 tools)
- `find_threads` - Search for threads in a forum by name
- `create_thread` - Create a new thread in a channel
- `archive_thread` - Archive and lock a thread

### Server Management (6 tools)
- `get_server_info` - Get detailed server information
- `modify_server` - Update server name, description, settings
- `get_audit_logs` - Retrieve audit log entries
- `list_webhooks` - List all webhooks in the server
- `create_webhook` - Create a new webhook
- `get_invites` - List active invite links
- `create_invite` - Create a new invite link

### Member Management (3 tools)
- `get_member_info` - Get detailed member information
- `list_members` - List all members with optional filters
- `set_nickname` - Change a member's server nickname

### Role Management (6 tools)
- `assign_role` - Add a role to a member
- `remove_role` - Remove a role from a member
- `create_role` - Create a new role with permissions
- `delete_role` - Delete a role
- `modify_role` - Update role settings and permissions
- `list_roles` - List all roles in the server
- `get_role_info` - Get detailed role information

### Moderation (5 tools)
- `kick_member` - Remove a member (they can rejoin)
- `ban_member` - Ban a member from the server
- `unban_member` - Remove a ban
- `timeout_member` - Temporarily mute a member
- `remove_timeout` - Remove a timeout from a member
- `get_bans` - List all banned users

### Resources
- `discord://guilds` - List all guilds the bot is connected to

### Prompts
- `moderate-channel` - Interactive channel moderation assistant
- `create-announcement` - Step-by-step announcement creation guide

## Configuration

### Environment Variables

Create a `.env` file (use `.env.example` as a template):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | **Yes** | - | Your Discord bot token |
| `TRANSPORT_MODE` | No | `http` | Transport mode: `http` or `stdio` |
| `HTTP_PORT` | No | `3000` | HTTP server port |
| `LOG_LEVEL` | No | `info` | Log level: `debug`, `info`, `warn`, `error` |
| `LOG_FORMAT` | No | `json` | Log format: `json` or `pretty` |

### Transport Modes

**HTTP Mode** (default):
- Server listens on HTTP port
- Suitable for remote connections
- Works with Claude Code HTTP transport
- Supports multiple concurrent clients

**Stdio Mode**:
- Communicates via stdin/stdout
- Suitable for local process integration
- Lower latency for local clients
- Single client only

## Development

### Project Structure

```
discord-agent-mcp/
├── src/
│   ├── server/          # MCP server implementation
│   │   ├── index.ts    # Main server entry point
│   │   └── config.ts   # Configuration management
│   ├── discord/         # Discord client management
│   │   └── client.ts   # Discord.js client wrapper
│   ├── tools/           # Discord tool implementations
│   │   ├── messaging.ts
│   │   ├── channels.ts
│   │   ├── members.ts
│   │   ├── roles.ts
│   │   ├── moderation.ts
│   │   └── server.ts
│   ├── resources/       # MCP resources
│   │   └── guilds.ts
│   ├── prompts/         # Interactive prompts
│   │   └── moderation.ts
│   ├── errors/          # Error definitions
│   ├── types/           # TypeScript types and schemas
│   └── utils/           # Utilities (logging, etc.)
├── k8s/                 # Kubernetes manifests
├── dist/                # Compiled JavaScript (generated)
├── .env.example         # Environment template
├── .mcp.json.example    # MCP config template
├── Dockerfile           # Container image definition
├── package.json         # Dependencies and scripts
└── tsconfig.json        # TypeScript configuration
```

### Building and Testing

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Development mode with auto-reload
npm run dev

# Run linting
npm run lint

# Run tests (if available)
npm test
```

### Adding New Tools

1. Create or modify a tool file in `src/tools/`
2. Use the `server.registerTool()` method
3. Define input/output schemas with Zod
4. Implement the tool logic
5. Rebuild and restart the server

Example:
```typescript
server.registerTool(
  "my_new_tool",
  {
    title: "My New Tool",
    description: "Does something useful",
    inputSchema: {
      param: z.string().describe("A parameter"),
    },
    outputSchema: {
      success: z.boolean(),
      result: z.string().optional(),
    },
  },
  async ({ param }) => {
    // Tool implementation
    return {
      content: [{ type: "text", text: "Done!" }],
      structuredContent: { success: true, result: "value" },
    };
  }
);
```

## Troubleshooting

### Discord Connection Issues

**Bot not connecting:**
- Verify your `DISCORD_TOKEN` in `.env` is correct
- Check the token hasn't been regenerated in Discord Developer Portal
- Ensure bot has proper intents enabled (Server Members, Message Content)

**Bot connected but can't see channels:**
- Check bot has "View Channels" permission
- Ensure bot role is positioned correctly in role hierarchy
- Verify bot has been added to your server

### MCP Server Issues

**Server won't start:**
```bash
# Check if port is already in use
lsof -i :3000

# Try a different port
HTTP_PORT=3001 npm start
```

**Tools not working:**
```bash
# Check server logs for errors
tail -f logs/discord-mcp.log

# Test with curl
curl http://localhost:3000/health
```

### Claude Code Integration Issues

**Claude Code can't connect:**
```bash
# Verify server is running
curl http://localhost:3000/health

# Check MCP server list
claude mcp list

# Remove and re-add the server
claude mcp remove discord-agent
claude mcp add --transport http discord-agent http://localhost:3000/mcp
```

**Tools not appearing:**
- Restart Claude Code after adding the server
- Check server logs for connection attempts
- Verify no firewall blocking localhost:3000

### Permission Errors

**Bot can't perform actions:**
- Verify bot has the required permission for the action
- Check bot's role position in server settings
- Ensure channel-specific permissions aren't blocking the bot
- Try giving bot "Administrator" permission temporarily for testing

## Security

### Best Practices

- **Never commit `.env` files** - Always use `.env.example` as a template
- **Rotate tokens regularly** - Regenerate bot token periodically
- **Use least privilege** - Only grant necessary Discord permissions
- **Secure your server** - Use firewall rules if exposing HTTP port
- **Monitor audit logs** - Check Discord's audit log for bot actions

### Token Security

Your Discord bot token should be treated like a password:

✅ **Do:**
- Store in `.env` file (gitignored)
- Use environment variables in production
- Regenerate if exposed
- Use Kubernetes secrets for cluster deployments

❌ **Don't:**
- Commit tokens to version control
- Share tokens publicly
- Embed tokens in code
- Expose tokens in logs

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly with a development Discord server
5. Submit a pull request

### Guidelines

- **Security First**: Never commit secrets or tokens
- **TypeScript**: Use strict typing and follow existing patterns
- **Documentation**: Update README and add JSDoc comments
- **Testing**: Test with a development server before submitting
- **Code Style**: Run `npm run lint` before committing

## License

MIT License - See [LICENSE](LICENSE) file for details

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification and documentation
- [Discord Developer Portal](https://discord.com/developers/applications) - Create and manage Discord bots
- [Discord.js Guide](https://discordjs.guide/) - Discord.js library documentation
- [Claude Code](https://claude.ai/claude-code) - AI-powered development assistant
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) - Official MCP SDK

## Support

- **Issues**: [GitHub Issues](https://github.com/aj-geddes/discord-agent-mcp/issues)
- **Discord.js**: [Discord.js Discord Server](https://discord.gg/djs)
- **MCP Protocol**: [MCP Specification](https://spec.modelcontextprotocol.io/)

---

Built with ❤️ using TypeScript, Discord.js, and the Model Context Protocol
