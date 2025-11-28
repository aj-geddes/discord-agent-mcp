---
layout: default
title: "Troubleshooting - Discord Agent MCP"
description: "Solve common Discord Agent MCP issues. Connection problems, permission errors, Claude Code integration, and Docker troubleshooting."
keywords: "Discord bot troubleshooting, MCP server issues, Discord bot not working, Claude Code connection issues"
permalink: /troubleshooting/
---

# Troubleshooting

Solutions for common Discord Agent MCP issues.

---

## Quick Diagnostics

Run these commands to quickly identify issues:

```bash
# Check if server is running
curl http://localhost:3000/health

# Check Discord connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"resources/read","params":{"uri":"discord://guilds"}}'

# Check available tools
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'
```

---

## Discord Connection Issues

### Bot Not Connecting

**Symptoms:**
- Server starts but Discord shows offline
- "Discord client not connected" errors
- Health check shows `"discord": "disconnected"`

**Solutions:**

1. **Verify your token**
   ```bash
   # Check token is set
   echo $DISCORD_TOKEN | head -c 20
   # Should show first 20 chars of your token
   ```

2. **Check token validity**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Select your application → Bot
   - If you've regenerated the token, update your `.env`

3. **Enable required intents**
   - In Developer Portal → Bot → Privileged Gateway Intents
   - Enable: **Server Members Intent** and **Message Content Intent**
   - Save changes

4. **Check for connection errors in logs**
   ```bash
   # Local
   npm start 2>&1 | grep -i "discord\|error\|token"

   # Docker
   docker logs discord-mcp 2>&1 | grep -i "discord\|error\|token"
   ```

### Bot Online But Can't See Channels/Members

**Solutions:**

1. **Verify bot is in server**
   - Check Server Settings → Integrations
   - Look for your bot in the list

2. **Check bot permissions**
   - Server Settings → Roles → [Your Bot Role]
   - Ensure "View Channels" is enabled
   - Check role hierarchy (bot role should be above roles it needs to manage)

3. **Check channel-specific permissions**
   - Right-click channel → Edit Channel → Permissions
   - Verify bot has access

### Frequent Disconnections

**Solutions:**

1. **Check network stability**
   ```bash
   ping discord.com
   ```

2. **Increase reconnect settings**
   ```bash
   RECONNECT_MAX_RETRIES=10
   RECONNECT_BACKOFF_MS=2000
   ```

3. **Check for rate limiting**
   - Review logs for rate limit warnings
   - Reduce request frequency if needed

---

## MCP Server Issues

### Server Won't Start

**Symptoms:**
- `npm start` fails
- Port already in use error
- Module not found errors

**Solutions:**

1. **Port already in use**
   ```bash
   # Find what's using port 3000
   lsof -i :3000

   # Kill the process
   kill -9 <PID>

   # Or use different port
   HTTP_PORT=3001 npm start
   ```

2. **Missing dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Build errors**
   ```bash
   # Check for TypeScript errors
   npm run build 2>&1

   # Clear dist and rebuild
   rm -rf dist
   npm run build
   ```

### Tools Not Working

**Symptoms:**
- Tool calls return errors
- "Permission denied" messages
- Empty responses

**Solutions:**

1. **Check bot permissions for the action**

   | Tool | Required Permissions |
   |------|---------------------|
   | send_message | Send Messages |
   | delete_message | Manage Messages |
   | kick_member | Kick Members |
   | ban_member | Ban Members |
   | create_channel | Manage Channels |
   | assign_role | Manage Roles |

2. **Verify role hierarchy**
   - Bot's role must be higher than target role/member
   - Check Server Settings → Roles → drag to reorder

3. **Check channel-specific overrides**
   - Channel permissions can override server permissions
   - Right-click channel → Edit Channel → Permissions

---

## Claude Code Integration

### Can't Add MCP Server

**Symptoms:**
- `claude mcp add` fails
- Server not showing in `claude mcp list`

**Solutions:**

1. **Verify server is running first**
   ```bash
   # In one terminal
   npm start

   # In another terminal
   curl http://localhost:3000/health
   # Should return {"status":"healthy","discord":"connected"}
   ```

2. **Add with correct URL**
   ```bash
   claude mcp add --transport http discord-agent http://localhost:3000/mcp
   ```

3. **Check Claude Code version**
   ```bash
   claude --version
   # Update if needed
   ```

### Tools Not Appearing in Claude Code

**Solutions:**

1. **Restart Claude Code**
   - Close and reopen the application
   - Tools load at startup

2. **Re-add the server**
   ```bash
   claude mcp remove discord-agent
   claude mcp add --transport http discord-agent http://localhost:3000/mcp
   claude mcp list
   ```

3. **Check for connection errors**
   - Look at MCP server logs when Claude Code connects
   - Should see "Client connected" messages

### Claude Code Can't Connect

**Symptoms:**
- "Connection refused" errors
- Timeout errors
- "Server unavailable" messages

**Solutions:**

1. **Verify URL is correct**
   ```bash
   # List current config
   claude mcp list

   # Should show: discord-agent: http://localhost:3000/mcp (HTTP)
   ```

2. **Check firewall**
   ```bash
   # Allow port 3000 (Linux)
   sudo ufw allow 3000

   # Check if blocked (macOS)
   sudo pfctl -sr | grep 3000
   ```

3. **Try different port**
   ```bash
   HTTP_PORT=8080 npm start
   claude mcp remove discord-agent
   claude mcp add --transport http discord-agent http://localhost:8080/mcp
   ```

---

## Docker Issues

### Container Won't Start

**Solutions:**

1. **Check logs**
   ```bash
   docker logs discord-mcp
   ```

2. **Verify environment variables**
   ```bash
   docker run --rm \
     -e DISCORD_TOKEN=your_token \
     discord-mcp-server:latest \
     printenv | grep DISCORD
   ```

3. **Rebuild image**
   ```bash
   docker build --no-cache -t discord-mcp-server:latest .
   ```

### Container Keeps Restarting

**Solutions:**

1. **Check exit code**
   ```bash
   docker inspect discord-mcp --format='{{.State.ExitCode}}'
   ```

2. **Check for OOM (Out of Memory)**
   ```bash
   docker inspect discord-mcp --format='{{.State.OOMKilled}}'
   ```

3. **Increase memory limit**
   ```bash
   docker run -d --memory=512m --name discord-mcp ...
   ```

### Can't Connect to Container

**Solutions:**

1. **Verify port mapping**
   ```bash
   docker ps
   # Look for 0.0.0.0:3000->3000/tcp
   ```

2. **Check container IP** (if not using port mapping)
   ```bash
   docker inspect discord-mcp --format='{{.NetworkSettings.IPAddress}}'
   ```

3. **Check Docker network**
   ```bash
   docker network ls
   docker network inspect bridge
   ```

---

## Permission Errors

### "Missing Permission" Errors

**Error:**
```
Error: Missing permission MANAGE_MESSAGES in channel 123456789
```

**Solutions:**

1. **Grant permission in Discord**
   - Server Settings → Roles → [Bot Role]
   - Enable the required permission
   - Or: Grant Administrator for testing

2. **Check channel overrides**
   - Channel might deny the permission specifically
   - Right-click channel → Edit Channel → Permissions

3. **Check role hierarchy**
   - Can't manage roles/members above bot's highest role
   - Drag bot's role higher in Server Settings → Roles

### "Cannot Modify Higher Role" Errors

**Error:**
```
Error: Cannot assign role that is higher than bot's highest role
```

**Solutions:**

1. **Reorder roles**
   - Server Settings → Roles
   - Drag your bot's role above the target role

2. **Note: Can't modify server owner**
   - Bot cannot kick/ban/timeout the server owner
   - This is a Discord limitation

---

## Rate Limiting

### "Rate Limit Exceeded" Errors

**Symptoms:**
- Operations failing after many requests
- "Retry after X ms" messages

**Solutions:**

1. **Slow down requests**
   - Add delays between bulk operations
   - Use bulk_delete_messages instead of many delete_message calls

2. **Check for loops**
   - Ensure no infinite loops in your usage
   - Review recent actions in audit log

3. **Wait for cooldown**
   - Discord rate limits reset after the specified time
   - Check error message for retry time

---

## Common Error Messages

### "DiscordNotConnectedError"

**Cause:** Bot hasn't established connection to Discord gateway

**Fix:**
- Check DISCORD_TOKEN
- Wait for connection (can take 10-30 seconds at startup)
- Check network connectivity

### "GuildNotFoundError"

**Cause:** Bot is not a member of the specified server

**Fix:**
- Verify guildId is correct
- Invite bot to the server
- Check bot hasn't been kicked

### "ChannelNotFoundError"

**Cause:** Channel doesn't exist or bot can't see it

**Fix:**
- Verify channelId
- Check bot has View Channels permission
- Channel may have been deleted

### "InvalidInputError"

**Cause:** Parameter validation failed

**Fix:**
- Check parameter types (strings for IDs)
- Verify content length limits
- Check for required parameters

---

## Getting Help

If you're still stuck:

1. **Check the logs**
   ```bash
   LOG_LEVEL=debug npm start
   ```

2. **Search existing issues**
   - [GitHub Issues](https://github.com/aj-geddes/discord-agent-mcp/issues)

3. **Open a new issue**
   - Include error messages
   - Include relevant logs
   - Describe steps to reproduce

4. **Resources**
   - [Discord Developer Portal](https://discord.com/developers/applications)
   - [Discord.js Guide](https://discordjs.guide/)
   - [MCP Specification](https://spec.modelcontextprotocol.io/)
