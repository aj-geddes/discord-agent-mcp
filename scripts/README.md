# Scripts Directory

This directory contains example scripts that demonstrate how to use the Discord MCP server programmatically.

## ⚠️ Important Notes

- These scripts are **examples only** and may contain hardcoded IDs from development/testing
- **Do NOT use these scripts in production without modification**
- Replace all hardcoded Guild IDs, Channel IDs, and User IDs with your own
- Always use environment variables for sensitive data (see `.env.example`)

## Usage

### Prerequisites

1. Set up your `.env` file with your Discord bot token:
   ```bash
   cp ../.env.example ../.env
   # Edit .env and add your DISCORD_TOKEN
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Modify the script to use your server's IDs

4. Run the script:
   ```bash
   node scripts/your-script.js
   ```

## Better Alternative: Use the MCP Server

Instead of running these scripts directly, we recommend using the MCP server with Claude Code:

1. Deploy the MCP server (see main README.md)
2. Configure Claude Code to connect to it (see `.mcp.json.example`)
3. Use the Discord tools directly in your Claude Code session

This provides a more robust, type-safe interface with built-in error handling.

## Example Scripts

- `test-mcp-updates.js` - Demonstrates testing content updates via MCP server tools
- `create-forum-post.js` - Example of posting to a forum channel
- `list-channels.js` - Example of listing all channels in a server

See individual scripts for more details on their functionality.
