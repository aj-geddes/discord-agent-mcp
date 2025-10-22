import { DiscordMCPError } from "./base.js";

export class DiscordNotConnectedError extends DiscordMCPError {
  constructor() {
    super(
      "Discord client is not connected",
      "DISCORD_NOT_CONNECTED",
      "Ensure the bot is logged in before making requests. The server should initialize the Discord client on startup.",
    );
  }
}

export class PermissionDeniedError extends DiscordMCPError {
  constructor(permission: string, resourceId: string) {
    super(
      `Missing permission: ${permission} for resource ${resourceId}`,
      "PERMISSION_DENIED",
      `Grant the bot the '${permission}' permission in the Discord Developer Portal or server settings`,
    );
  }
}

export class ChannelNotFoundError extends DiscordMCPError {
  constructor(channelId: string) {
    super(
      `Channel not found: ${channelId}`,
      "CHANNEL_NOT_FOUND",
      "Verify the channel ID is correct and the bot has access to it",
    );
  }
}

export class GuildNotFoundError extends DiscordMCPError {
  constructor(guildId: string) {
    super(
      `Guild not found: ${guildId}`,
      "GUILD_NOT_FOUND",
      "Verify the guild ID is correct and the bot is a member of it",
    );
  }
}

export class MessageNotFoundError extends DiscordMCPError {
  constructor(messageId: string) {
    super(
      `Message not found: ${messageId}`,
      "MESSAGE_NOT_FOUND",
      "Verify the message ID is correct and the message has not been deleted",
    );
  }
}

export class RateLimitError extends DiscordMCPError {
  constructor(public retryAfter: number) {
    super(
      `Rate limited. Retry after ${retryAfter}ms`,
      "RATE_LIMITED",
      `Wait ${retryAfter}ms before retrying`,
    );
  }
}

export class InvalidInputError extends DiscordMCPError {
  constructor(field: string, reason: string) {
    super(
      `Invalid input for ${field}: ${reason}`,
      "INVALID_INPUT",
      `Correct the ${field} field: ${reason}`,
    );
  }
}
