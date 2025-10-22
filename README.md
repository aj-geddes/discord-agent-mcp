# Discord MCP Server

Production-ready Model Context Protocol (MCP) server for AI-assisted Discord management and automation.

## Features

- **46+ Discord Tools**: Complete Discord API integration for messaging, channels, threads, roles, members, and moderation
- **MCP Protocol Compliant**: Full implementation of Model Context Protocol for seamless AI integration
- **Robust Session Management**: Persistent Discord connection with automatic reconnection
- **Production Ready**: Built with TypeScript, comprehensive error handling, structured logging
- **Kubernetes Native**: Deploy to K3d, K8s, or any Kubernetes cluster
- **Multiple Transport Modes**: HTTP and stdio transports supported
- **Claude Code Integration**: Native integration with Anthropic's Claude Code CLI

## 🔒 Security

This project handles sensitive Discord bot tokens. **Never commit secrets to version control.**

- ✅ `.env` files are gitignored
- ✅ `k8s/secret.yaml` is gitignored
- ✅ Use `k8s/secret.yaml.example` as a template
- ✅ Use environment variables for all sensitive data
- ✅ Review `.gitignore` before committing

## Quick Start

### Prerequisites

- Node.js >= 20.0.0
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- Docker (for containerized deployment)
- K3d or Kubernetes cluster (for K8s deployment)

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   # Edit .env and add your DISCORD_TOKEN
   ```

3. Build:
   ```bash
   npm run build
   ```

4. Run:
   ```bash
   npm start
   ```

### Docker Build

```bash
docker build -t discord-mcp-server:latest .
```

### Kubernetes Deployment

1. Build and load image to K3d:
   ```bash
   docker build -t discord-mcp-server:latest .
   k3d image import discord-mcp-server:latest -c your-cluster-name
   ```

2. Create secret with your Discord token:
   ```bash
   # Copy the example secret file
   cp k8s/secret.yaml.example k8s/secret.yaml

   # Edit k8s/secret.yaml and replace YOUR_DISCORD_BOT_TOKEN_HERE with your actual token
   # Get your token from: https://discord.com/developers/applications
   ```

3. Deploy:
   ```bash
   kubectl apply -f k8s/namespace.yaml
   kubectl apply -f k8s/secret.yaml
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/deployment.yaml
   kubectl apply -f k8s/service.yaml
   ```

4. Verify deployment:
   ```bash
   kubectl get pods -n discord-agent-mcp
   kubectl logs -n discord-agent-mcp -l app=discord-mcp-server -f
   ```

5. Access the MCP server:
   ```bash
   # Port-forward to access locally
   kubectl port-forward -n discord-agent-mcp svc/discord-mcp-server 3000:3000

   # Test the server
   curl http://localhost:3000/health
   ```

## Configuration

See `.env.example` for all configuration options.

### Required Configuration

- `DISCORD_TOKEN`: Your Discord bot token (required)

### Optional Configuration

- `TRANSPORT_MODE`: `stdio` or `http` (default: `http`)
- `HTTP_PORT`: HTTP server port (default: `3000`)
- `LOG_LEVEL`: Logging level - `debug`, `info`, `warn`, `error` (default: `info`)
- `LOG_FORMAT`: Log format - `json` or `pretty` (default: `json`)

## Claude Code Integration

Use the Discord MCP server directly in Claude Code for AI-assisted Discord management:

1. Ensure the MCP server is running and accessible at `http://localhost:3000/mcp`

2. Configure Claude Code to use the server:
   ```bash
   # Using Claude Code CLI
   claude mcp add --transport http discord-agent http://localhost:3000/mcp

   # Or create .mcp.json in your project root
   cp .mcp.json.example .mcp.json
   ```

3. Restart Claude Code and verify the connection:
   ```bash
   claude mcp list
   # Should show: discord-agent: http://localhost:3000/mcp (HTTP)
   ```

4. Use Discord tools directly in Claude Code:
   - Type `/mcp` to see available servers
   - All 46+ Discord tools are now available as native MCP tools
   - Example: Use `mcp__discord-agent__send_message` to send messages

## Available Tools (46+)

### Messaging (10 tools)
- `send_message`, `send_rich_message`, `send_message_with_file`
- `read_messages`, `edit_message`, `delete_message`, `bulk_delete_messages`
- `add_reaction`, `pin_message`, `unpin_message`

### Channels (10 tools)
- `list_channels`, `get_channel_details`, `create_text_channel`
- `create_voice_channel`, `create_category`, `create_forum_channel`
- `create_stage_channel`, `modify_channel`, `delete_channel`
- `set_channel_permissions`

### Threads (3 tools)
- `find_threads`, `create_thread`, `archive_thread`

### Server Management (6 tools)
- `get_server_info`, `modify_server`, `get_audit_logs`
- `list_webhooks`, `create_webhook`, `get_invites`, `create_invite`

### Members (3 tools)
- `get_member_info`, `list_members`, `set_nickname`

### Roles (6 tools)
- `assign_role`, `remove_role`, `create_role`
- `delete_role`, `modify_role`, `list_roles`, `get_role_info`

### Moderation (5 tools)
- `kick_member`, `ban_member`, `unban_member`
- `timeout_member`, `remove_timeout`, `get_bans`

See the full tool list by running `claude mcp list` or `/mcp` in Claude Code.

## Available Resources

- `discord://guilds`: List all guilds the bot is connected to

## Available Prompts

- `moderate-channel`: Interactive channel moderation assistant
- `create-announcement`: Step-by-step announcement creation guide

## Architecture

See [specifications.md](specifications.md) for comprehensive technical documentation.

## Development

### Project Structure

```
discord-agent-mcp/
├── src/
│   ├── server/          # MCP server implementation
│   ├── tools/           # Discord tool implementations
│   ├── resources/       # MCP resources (guilds, channels)
│   └── prompts/         # Interactive prompts
├── k8s/                 # Kubernetes manifests
├── scripts/             # Example scripts (see scripts/README.md)
├── dist/                # Compiled JavaScript (generated)
└── docs/                # Additional documentation
```

### Building

```bash
npm run build        # Compile TypeScript
npm run dev          # Development mode with auto-reload
npm run lint         # Run ESLint
npm run format       # Format with Prettier
```

### Testing

```bash
npm test             # Run tests
npm run test:watch   # Watch mode
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Security First**: Never commit secrets or tokens
2. **Use Example IDs**: Replace all real Discord IDs with placeholders in documentation
3. **Follow TypeScript**: Use strict typing and follow existing patterns
4. **Document Tools**: Add comprehensive descriptions for new MCP tools
5. **Test Thoroughly**: Test with a development Discord server before submitting

See `scripts/README.md` for information about the example scripts directory.

## Troubleshooting

### Port-forward issues
```bash
# Kill existing port-forwards
pkill -f "kubectl port-forward"

# Restart port-forward
kubectl port-forward -n discord-agent-mcp svc/discord-mcp-server 3000:3000
```

### Discord token errors
- Verify token in `.env` or Kubernetes secret
- Ensure token has necessary bot permissions
- Check Discord Developer Portal for token status

### MCP connection issues
- Verify server is running: `curl http://localhost:3000/health`
- Check Claude Code config: `claude mcp list`
- Review server logs: `kubectl logs -n discord-agent-mcp -l app=discord-mcp-server`

## License

MIT License - See [LICENSE](LICENSE) file for details

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP specification
- [Discord Developer Portal](https://discord.com/developers/applications) - Create and manage Discord bots
- [Claude Code](https://claude.ai/claude-code) - AI-powered development assistant
- [Discord.js Guide](https://discordjs.guide/) - Discord.js documentation
