import { Client, Events, GatewayIntentBits } from "discord.js";
import { Logger } from "../utils/logger.js";
import { DiscordNotConnectedError } from "../errors/discord.js";

export class DiscordClientManager {
  private client: Client | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectBackoffMs: number;

  constructor(
    private token: string,
    private logger: Logger,
    options?: {
      maxReconnectAttempts?: number;
      reconnectBackoffMs?: number;
    },
  ) {
    this.maxReconnectAttempts = options?.maxReconnectAttempts ?? 5;
    this.reconnectBackoffMs = options?.reconnectBackoffMs ?? 1000;
  }

  async connect(): Promise<void> {
    if (this.connected) {
      this.logger.warn("Discord client already connected");
      return;
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ],
    });

    this.setupEventHandlers();

    try {
      await this.client.login(this.token);
      this.connected = true;
      this.reconnectAttempts = 0;
      this.logger.info("Discord client connected successfully");
    } catch (error: any) {
      this.logger.error("Failed to connect to Discord", {
        error: error.message,
      });
      throw new Error(`Discord connection failed: ${error.message}`);
    }
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.once(Events.ClientReady, (readyClient) => {
      this.logger.info(`Logged in as ${readyClient.user.tag}`, {
        userId: readyClient.user.id,
        guildCount: readyClient.guilds.cache.size,
      });
    });

    this.client.on(Events.Error, (error) => {
      this.logger.error("Discord client error", { error: error.message });
    });

    this.client.on(Events.Warn, (warning) => {
      this.logger.warn("Discord client warning", { warning });
    });

    this.client.on(Events.Debug, (info) => {
      this.logger.debug("Discord debug info", { info });
    });

    // Handle disconnection
    this.client.on(Events.ShardDisconnect, async (event) => {
      this.logger.warn("Discord client disconnected", {
        code: event.code,
        reason: event.reason,
      });
      this.connected = false;
      await this.attemptReconnect();
    });

    // Handle reconnection
    this.client.on(Events.ShardReconnecting, () => {
      this.logger.info("Discord client reconnecting...");
    });

    this.client.on(Events.ShardResume, () => {
      this.logger.info("Discord client resumed");
      this.connected = true;
      this.reconnectAttempts = 0;
    });
  }

  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error("Max reconnect attempts reached");
      throw new Error("Discord reconnection failed - max attempts exceeded");
    }

    this.reconnectAttempts++;
    const backoff =
      this.reconnectBackoffMs * Math.pow(2, this.reconnectAttempts - 1);

    this.logger.info(
      `Reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${backoff}ms`,
    );

    await new Promise((resolve) => setTimeout(resolve, backoff));

    try {
      await this.connect();
    } catch (error: any) {
      this.logger.error("Reconnection attempt failed", {
        error: error.message,
      });
      await this.attemptReconnect();
    }
  }

  getClient(): Client {
    if (!this.client || !this.connected) {
      throw new DiscordNotConnectedError();
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = null;
      this.connected = false;
      this.logger.info("Discord client disconnected");
    }
  }

  getStats() {
    if (!this.client || !this.connected) {
      return {
        connected: false,
        guilds: 0,
        channels: 0,
        users: 0,
        ping: 0,
      };
    }

    return {
      connected: true,
      guilds: this.client.guilds.cache.size,
      channels: this.client.channels.cache.size,
      users: this.client.users.cache.size,
      ping: this.client.ws.ping,
    };
  }
}
