# Docker MCP Catalog Submission Guide

This document outlines the steps to submit the Discord Agent MCP server to the Docker MCP Catalog.

## Prerequisites

✅ **Completed:**
- [x] MIT License added (LICENSE file)
- [x] server.yaml configuration created
- [x] tools.json with all 46 tools
- [x] catalog-readme.md for catalog display
- [x] Dockerfile verified and tested
- [x] Docker build successful

## Files Required for Submission

The following files have been created for catalog submission:

### 1. `server.yaml`
Main configuration file defining:
- Server name: `discord-agent`
- Type: `local` (containerized)
- Category: `communication`
- Build configuration
- Environment variables
- Icon and documentation URLs

### 2. `tools.json`
List of all 46 available tools with names and descriptions. Used during catalog build process to verify the server works correctly.

### 3. `catalog-readme.md`
Concise documentation for catalog users explaining:
- Features and capabilities
- Prerequisites (Discord bot setup)
- Quick start guide
- Available tools organized by category
- Use cases and examples

### 4. `LICENSE`
MIT License allowing free use and distribution (required by catalog).

### 5. `Dockerfile`
Multi-stage Docker build with:
- Non-root user (security best practice)
- Health check endpoint
- Production-optimized build
- Environment variable support

## Submission Process

### Step 1: Ensure GitHub Repository is Ready

The repository is at: https://github.com/aj-geddes/discord-agent-mcp

Verify:
- [x] All catalog files committed and pushed
- [x] README.md is comprehensive
- [x] Dockerfile is in repository root
- [x] Repository is public
- [x] License is clear (MIT)

### Step 2: Fork docker/mcp-registry

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/mcp-registry.git
cd mcp-registry
```

### Step 3: Install Prerequisites

```bash
# Install Go 1.24+
go version

# Install Task automation tool
# macOS
brew install go-task/tap/go-task

# Linux
sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d

# Verify
task --version
```

### Step 4: Create Server Entry

Option A: Use the wizard (recommended):
```bash
task wizard
```

Follow the prompts:
- Category: `communication`
- GitHub URL: `https://github.com/aj-geddes/discord-agent-mcp`
- Add environment variable: `DISCORD_TOKEN` (required, secret)

Option B: Manual creation:
```bash
task create -- --category communication https://github.com/aj-geddes/discord-agent-mcp -e DISCORD_TOKEN=placeholder
```

This will:
1. Clone the repository
2. Build the Docker image using the Dockerfile
3. Run the container and verify MCP server responds
4. Create `servers/discord-agent/` directory with necessary files
5. Copy over `server.yaml`, `tools.json`, and readme

### Step 5: Test the Build

```bash
# Build the image
task build -- --tools discord-agent

# Test in catalog
task catalog -- discord-agent
```

The build process will:
- Pull and build the Docker image
- Verify the MCP server can list tools
- Confirm tools.json matches server response

### Step 6: Submit Pull Request

```bash
# Commit changes
git add servers/discord-agent/
git commit -m "Add Discord Agent MCP server

Production-ready MCP server for Discord automation with 46+ tools:
- Messaging (10 tools)
- Channel management (10 tools)
- Thread management (3 tools)
- Server management (6 tools)
- Member management (3 tools)
- Role management (6 tools)
- Moderation (5 tools)

Category: communication
License: MIT
Homepage: https://github.com/aj-geddes/discord-agent-mcp"

# Push to your fork
git push origin main

# Create PR on GitHub
```

### Step 7: PR Review Process

The Docker team will review:
- Server functionality and tool listings
- Documentation quality
- Security best practices
- License compatibility
- Docker image builds successfully

### Step 8: Approval and Publication

Once approved:
- Entry goes live within 24 hours
- Available in:
  - MCP Catalog (web)
  - Docker Desktop MCP Toolkit
  - Docker Hub (`mcp/discord-agent`)

## Post-Submission

### Updating the Server

To update after submission:
1. Make changes in https://github.com/aj-geddes/discord-agent-mcp
2. Tag a new release
3. Submit PR to mcp-registry updating the entry
4. Docker will rebuild and redeploy

### Monitoring

After publication:
- Monitor GitHub issues for user feedback
- Check Docker Hub for image pull metrics
- Respond to questions in mcp-registry discussions

## Important Notes

### Environment Variables

The server requires `DISCORD_TOKEN`:
- Mark as `secret: true` in server.yaml
- Users will be prompted to provide this when enabling
- Never include real tokens in examples or documentation

### Icon

Currently using Discord's official Clyde icon. If Discord requests removal:
1. Create custom icon (512x512 PNG)
2. Add to `assets/discord-icon.png`
3. Update `server.yaml` icon URL
4. Commit and push
5. Update catalog entry

### Support

Users may have questions about:
- Discord bot setup (point to Developer Portal)
- Bot permissions (document in readme)
- MCP integration (provide examples)
- Troubleshooting (maintain issue templates)

## Testing Checklist

Before submission, verify:

- [x] Docker build succeeds
- [x] Server starts without errors (with valid DISCORD_TOKEN)
- [x] Health check endpoint responds
- [x] MCP server lists all 46 tools correctly
- [x] tools.json matches actual tool list
- [x] Documentation is clear and accurate
- [x] License file present
- [x] Repository is public and accessible

## Helpful Resources

- [Docker MCP Registry](https://github.com/docker/mcp-registry)
- [Contributing Guide](https://github.com/docker/mcp-registry/blob/main/CONTRIBUTING.md)
- [MCP Protocol Docs](https://modelcontextprotocol.io/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [Docker Hub MCP Namespace](https://hub.docker.com/u/mcp)

## Questions?

For submission questions:
- Open an issue in docker/mcp-registry
- Join MCP community discussions
- Check existing server examples in the registry

---

**Status**: Ready for submission ✅

Last Updated: October 22, 2025
