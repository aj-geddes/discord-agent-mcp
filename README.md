# Discord Agent MCP

[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://aj-geddes.github.io/discord-agent-mcp/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-Compatible-purple)](https://modelcontextprotocol.io/)

**AI-Powered Discord Server Management** - A production-ready Model Context Protocol (MCP) server with 71 tools for comprehensive Discord automation through Claude AI.

---

## Documentation

**[View Full Documentation →](https://aj-geddes.github.io/discord-agent-mcp/)**

- [Getting Started Guide](https://aj-geddes.github.io/discord-agent-mcp/getting-started/)
- [71 Tools Reference](https://aj-geddes.github.io/discord-agent-mcp/tools/)
- [Interactive Prompts](https://aj-geddes.github.io/discord-agent-mcp/prompts/)
- [Deployment Guide](https://aj-geddes.github.io/discord-agent-mcp/deployment/)
- [API Reference](https://aj-geddes.github.io/discord-agent-mcp/api/)
- [Troubleshooting](https://aj-geddes.github.io/discord-agent-mcp/troubleshooting/)

---

## What Is This?

Discord Agent MCP bridges Claude AI with Discord, letting you manage your server through natural language. Instead of clicking through Discord's interface or writing code, just tell Claude what you want:

```
"Create a gaming community server with voice channels for different games,
a welcome channel, and moderator roles"
```

Claude handles the rest using the 71 Discord management tools provided by this MCP server.

---

## Features

### 71 Discord Tools

| Category | Tools | Description |
|----------|-------|-------------|
| Messaging | 10 | Send, edit, delete, react, pin messages |
| Channels | 10 | Create, modify, delete channels and permissions |
| Threads | 3 | Create and manage forum threads |
| Server | 7 | Settings, webhooks, invites, audit logs |
| Members | 3 | Info, listings, nicknames |
| Roles | 7 | Create, assign, modify roles |
| Moderation | 6 | Kick, ban, timeout, manage bans |
| Emojis | 4 | Custom emoji management |
| Stickers | 4 | Custom sticker management |
| Events | 6 | Scheduled events |
| Auto-Mod | 5 | Automatic moderation rules |
| Commands | 6 | Slash command management |

### Production Ready

- **Persistent Connection**: Robust Discord.js client with automatic reconnection
- **Type Safe**: Full TypeScript with Zod validation
- **Comprehensive Errors**: Detailed error messages with resolution guidance
- **Structured Logging**: JSON logging with configurable levels
- **Flexible Deployment**: Local, Docker, or Kubernetes

### Claude Code Integration

First-class support for Anthropic's Claude Code CLI:

```bash
claude mcp add --transport http discord-agent http://localhost:3000/mcp
```

---

## Quick Start

### 1. Prerequisites

- Node.js 20.0.0+
- A Discord bot token ([Create one here](https://discord.com/developers/applications))

### 2. Install

```bash
git clone https://github.com/aj-geddes/discord-agent-mcp.git
cd discord-agent-mcp
npm install
```

### 3. Configure

```bash
cp .env.example .env
# Edit .env and add your DISCORD_TOKEN
```

### 4. Run

```bash
npm run build
npm start
# Server runs at http://localhost:3000/mcp
```

### 5. Connect to Claude Code

```bash
claude mcp add --transport http discord-agent http://localhost:3000/mcp
```

**[Full Setup Guide →](https://aj-geddes.github.io/discord-agent-mcp/getting-started/)**

---

## Deployment Options

### Docker

```bash
docker build -t discord-mcp-server:latest .
docker run -d -p 3000:3000 -e DISCORD_TOKEN=your_token discord-mcp-server:latest
```

### Docker Compose

```yaml
version: '3.8'
services:
  discord-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DISCORD_TOKEN=${DISCORD_TOKEN}
    restart: unless-stopped
```

### Kubernetes

```bash
kubectl apply -f k8s/
```

**[Full Deployment Guide →](https://aj-geddes.github.io/discord-agent-mcp/deployment/)**

---

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_TOKEN` | **Yes** | - | Discord bot token |
| `TRANSPORT_MODE` | No | `http` | `http` or `stdio` |
| `HTTP_PORT` | No | `3000` | Server port |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |

---

## Example Usage

Once connected, use natural language in Claude Code:

**Server Setup:**
```
"Set up a gaming community with channels for Minecraft, Valorant, and general chat"
```

**Moderation:**
```
"Timeout user 123456789 for 1 hour for spam"
```

**Events:**
```
"Create a voice event called 'Game Night' for Saturday at 8 PM"
```

**Automation:**
```
"Set up auto-moderation to block spam and timeout repeat offenders"
```

---

## Security

- **Never commit tokens** - Use `.env` files (gitignored)
- **Rotate tokens** - Regenerate periodically
- **Least privilege** - Only grant necessary permissions
- **Audit logs** - Monitor bot actions

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Test with a development Discord server
4. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## Resources

- **Documentation**: [aj-geddes.github.io/discord-agent-mcp](https://aj-geddes.github.io/discord-agent-mcp/)
- **MCP Protocol**: [modelcontextprotocol.io](https://modelcontextprotocol.io/)
- **Discord API**: [discord.com/developers](https://discord.com/developers/)
- **Issues**: [GitHub Issues](https://github.com/aj-geddes/discord-agent-mcp/issues)

---

## License

MIT License - See [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Discord Agent MCP</strong> - AI-Powered Discord Server Management
  <br>
  Built with TypeScript, Discord.js, and the Model Context Protocol
</p>
