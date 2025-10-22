import { Client, Guild } from "discord.js";
import { GuildNotFoundError } from "../errors/discord.js";

/**
 * Validates that the bot has access to a guild and fetches it
 * @param client Discord client instance
 * @param guildId Guild ID to validate
 * @returns Guild object if accessible
 * @throws GuildNotFoundError if guild is not accessible
 */
export async function validateGuildAccess(
  client: Client,
  guildId: string,
): Promise<Guild> {
  const guild = await client.guilds.fetch(guildId).catch(() => null);

  if (!guild) {
    throw new GuildNotFoundError(guildId);
  }

  return guild;
}

/**
 * Checks if the bot is a member of a guild without throwing
 * @param client Discord client instance
 * @param guildId Guild ID to check
 * @returns true if bot has access, false otherwise
 */
export async function hasGuildAccess(
  client: Client,
  guildId: string,
): Promise<boolean> {
  try {
    const guild = await client.guilds.fetch(guildId);
    return !!guild;
  } catch {
    return false;
  }
}
