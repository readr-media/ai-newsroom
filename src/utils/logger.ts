import type { Logger } from "../engine/types.js";

export function createConsoleLogger(): Logger {
  return {
    debug(message: string, meta?: unknown) {
      // eslint-disable-next-line no-console
      console.debug(prefix("DEBUG", message), meta ?? "");
    },
    info(message: string, meta?: unknown) {
      // eslint-disable-next-line no-console
      console.info(prefix("INFO", message), meta ?? "");
    },
    warn(message: string, meta?: unknown) {
      // eslint-disable-next-line no-console
      console.warn(prefix("WARN", message), meta ?? "");
    },
    error(message: string, meta?: unknown) {
      // eslint-disable-next-line no-console
      console.error(prefix("ERROR", message), meta ?? "");
    },
  };
}

function prefix(level: string, message: string) {
  const ts = new Date().toISOString();
  return `[${ts}] [${level}] ${message}`;
}


