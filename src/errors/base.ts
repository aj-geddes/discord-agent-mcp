export class DiscordMCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public resolution?: string,
  ) {
    super(message);
    this.name = "DiscordMCPError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      resolution: this.resolution,
    };
  }
}
