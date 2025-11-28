---
layout: default
title: "Discord Agent MCP - AI-Powered Discord Server Management"
description: "Automate Discord server management with 71 AI-powered tools. Manage channels, roles, moderation, events, and more through Claude AI and the Model Context Protocol."
keywords: "Discord bot, Discord automation, AI Discord management, MCP server, Claude AI Discord, Discord moderation bot, server management, community management"
---

<div class="hero-section">
  <h1>Discord Agent MCP</h1>
  <p class="hero-tagline">AI-Powered Discord Server Management</p>
  <p class="hero-description">
    Manage your Discord community with 71 powerful tools through Claude AI and the Model Context Protocol.
    Automate moderation, channels, roles, events, and more.
  </p>
  <div class="hero-buttons">
    <a href="{{ '/getting-started/' | relative_url }}" class="btn btn-primary">Get Started</a>
    <a href="https://github.com/aj-geddes/discord-agent-mcp" class="btn btn-secondary">View on GitHub</a>
  </div>
</div>

---

## Why Discord Agent MCP?

Running a Discord server is time-consuming. Between managing roles, moderating channels, organizing events, and keeping your community engaged, there's always more to do. **Discord Agent MCP** lets you delegate these tasks to AI.

<div class="features-grid">
  <div class="feature-card">
    <h3>71 Powerful Tools</h3>
    <p>Complete Discord API coverage - messaging, channels, roles, moderation, emojis, events, auto-mod, and slash commands.</p>
  </div>

  <div class="feature-card">
    <h3>Natural Language Control</h3>
    <p>Just tell Claude what you want: "Create a welcome channel with auto-role assignment" - and watch it happen.</p>
  </div>

  <div class="feature-card">
    <h3>Production Ready</h3>
    <p>TypeScript, comprehensive error handling, automatic reconnection, and structured logging for reliable operation.</p>
  </div>

  <div class="feature-card">
    <h3>Flexible Deployment</h3>
    <p>Run locally, in Docker, or Kubernetes. HTTP and stdio transports supported.</p>
  </div>
</div>

---

## What Can You Do?

### Server Administration
- Create and organize channels, categories, and forums
- Set up role hierarchies with granular permissions
- Configure auto-moderation rules for spam, keywords, and mentions
- Manage webhooks and integrations

### Community Moderation
- Monitor channels and review messages
- Timeout, kick, or ban problematic members
- Bulk delete messages with smart filters
- Track actions through audit logs

### Member Management
- Assign and remove roles automatically
- Set nicknames and manage member info
- List and filter members by role, join date, or status
- Set up welcome automations

### Engagement Features
- Schedule events (voice, stage, external)
- Create announcements with rich embeds
- Manage custom emojis and stickers
- Set up slash commands for your community

---

## Quick Example

Once configured, simply ask Claude:

```
"Set up a gaming community server with voice channels for
different games, a welcome channel, and moderator roles"
```

Claude will use the Discord Agent MCP tools to:
1. Create category channels for organization
2. Set up text and voice channels for each game
3. Create a welcome channel with proper permissions
4. Configure moderator and admin roles
5. Set up auto-moderation rules

All through natural conversation.

---

## Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| [Messaging](/discord-agent-mcp/tools/#messaging) | 10 | Send, edit, delete messages, reactions, pins |
| [Channels](/discord-agent-mcp/tools/#channel-management) | 10 | Create, modify, delete channels and permissions |
| [Threads](/discord-agent-mcp/tools/#thread-management) | 3 | Create and manage forum threads |
| [Server](/discord-agent-mcp/tools/#server-management) | 7 | Server settings, webhooks, invites, audit logs |
| [Members](/discord-agent-mcp/tools/#member-management) | 3 | Member info, listings, nicknames |
| [Roles](/discord-agent-mcp/tools/#role-management) | 7 | Create, assign, modify roles and permissions |
| [Moderation](/discord-agent-mcp/tools/#moderation) | 6 | Kick, ban, timeout, ban management |
| [Emojis](/discord-agent-mcp/tools/#emoji-management) | 4 | Custom emoji management |
| [Stickers](/discord-agent-mcp/tools/#sticker-management) | 4 | Custom sticker management |
| [Events](/discord-agent-mcp/tools/#scheduled-events) | 6 | Create and manage scheduled events |
| [Auto-Mod](/discord-agent-mcp/tools/#auto-moderation) | 5 | Configure automatic moderation rules |
| [Commands](/discord-agent-mcp/tools/#application-commands) | 6 | Slash command management |

**Total: 71 tools** for comprehensive Discord management.

---

## Get Started in 5 Minutes

```bash
# Clone the repository
git clone https://github.com/aj-geddes/discord-agent-mcp.git
cd discord-agent-mcp

# Install and build
npm install && npm run build

# Configure your Discord bot token
cp .env.example .env
# Edit .env with your DISCORD_TOKEN

# Start the server
npm start

# Add to Claude Code
claude mcp add --transport http discord-agent http://localhost:3000/mcp
```

[Full Setup Guide →]({{ '/getting-started/' | relative_url }})

---

## Built For

<div class="audience-grid">
  <div class="audience-card">
    <h4>Discord Server Admins</h4>
    <p>Automate repetitive tasks and manage your community more efficiently with AI assistance.</p>
  </div>

  <div class="audience-card">
    <h4>Community Managers</h4>
    <p>Set up moderation, events, and engagement features through natural language commands.</p>
  </div>

  <div class="audience-card">
    <h4>Developers</h4>
    <p>Integrate Discord management into AI workflows using the Model Context Protocol.</p>
  </div>

  <div class="audience-card">
    <h4>Gaming Communities</h4>
    <p>Organize game channels, voice rooms, and events for your gaming group.</p>
  </div>
</div>

---

## Open Source

Discord Agent MCP is **MIT licensed** and open source. Contributions welcome!

- [GitHub Repository](https://github.com/aj-geddes/discord-agent-mcp)
- [Report Issues](https://github.com/aj-geddes/discord-agent-mcp/issues)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

<div class="cta-section">
  <h2>Ready to Automate Your Discord Server?</h2>
  <p>Get started with Discord Agent MCP today and let AI handle the heavy lifting.</p>
  <a href="{{ '/getting-started/' | relative_url }}" class="btn btn-primary btn-large">Start the Setup Guide</a>
</div>

<style>
.hero-section {
  text-align: center;
  padding: 2rem 0 3rem;
}
.hero-tagline {
  font-size: 1.5rem;
  color: #586069;
  margin-bottom: 1rem;
}
.hero-description {
  font-size: 1.1rem;
  max-width: 700px;
  margin: 0 auto 2rem;
  color: #444;
}
.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-primary {
  background: #5865F2;
  color: white;
}
.btn-primary:hover {
  background: #4752C4;
  color: white;
}
.btn-secondary {
  background: #f6f8fa;
  color: #24292e;
  border: 1px solid #e1e4e8;
}
.btn-secondary:hover {
  background: #e1e4e8;
}
.btn-large {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}
.features-grid, .audience-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin: 2rem 0;
}
.feature-card, .audience-card {
  background: #f6f8fa;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e1e4e8;
}
.feature-card h3, .audience-card h4 {
  margin-top: 0;
  color: #5865F2;
}
.cta-section {
  text-align: center;
  background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%);
  color: white;
  padding: 3rem 2rem;
  border-radius: 12px;
  margin: 3rem 0 1rem;
}
.cta-section h2 {
  color: white;
  margin-top: 0;
}
.cta-section .btn-primary {
  background: white;
  color: #5865F2;
}
.cta-section .btn-primary:hover {
  background: #f0f0f0;
}
</style>
