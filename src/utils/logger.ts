export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: any;
}

export class Logger {
  constructor(
    private level: LogLevel = "info",
    private format: "json" | "pretty" = "json",
  ) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  private log(level: LogLevel, message: string, metadata?: object): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...metadata,
    };

    if (this.format === "json") {
      console.log(JSON.stringify(entry));
    } else {
      const meta = metadata ? ` ${JSON.stringify(metadata)}` : "";
      console.log(
        `[${entry.timestamp}] ${level.toUpperCase()}: ${message}${meta}`,
      );
    }
  }

  debug(message: string, metadata?: object): void {
    this.log("debug", message, metadata);
  }

  info(message: string, metadata?: object): void {
    this.log("info", message, metadata);
  }

  warn(message: string, metadata?: object): void {
    this.log("warn", message, metadata);
  }

  error(message: string, metadata?: object): void {
    this.log("error", message, metadata);
  }
}
