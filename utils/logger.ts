import { REQUEST_TYPE, CHAT_ID, TASKS_PLAN_ID } from "../config/env.js";

type LogLevel = "debug" | "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const LOG_LEVEL = (process.env.LOG_LEVEL as LogLevel) || "info";
const CURRENT_LEVEL = LEVELS[LOG_LEVEL] ?? LEVELS.info;

const baseContext = {
  chatId: CHAT_ID,
  tasksPlanId: TASKS_PLAN_ID,
  requestType: REQUEST_TYPE,
};

const serializeError = (err: unknown) => {
  if (!err) return err;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return err;
};

const jsonReplacer = (_key: string, value: unknown) => {
  if (value instanceof Error) return serializeError(value);
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Set) return Array.from(value);
  if (value instanceof Map) return Array.from(value.entries());
  return value;
};

const emit = (level: LogLevel, message: string, meta?: LogMeta) => {
  if (LEVELS[level] < CURRENT_LEVEL) return;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...baseContext,
    ...(meta ? { meta } : {}),
  };

  const json = JSON.stringify(payload, jsonReplacer);

  if (level === "error") {
    console.error(json);
  } else if (level === "warn") {
    console.warn(json);
  } else {
    console.log(json);
  }
};

export const logger = {
  debug: (message: string, meta?: LogMeta) => emit("debug", message, meta),
  info: (message: string, meta?: LogMeta) => emit("info", message, meta),
  warn: (message: string, meta?: LogMeta) => emit("warn", message, meta),
  error: (message: string, meta?: LogMeta) => emit("error", message, meta),
  child: (bindings: LogMeta) => ({
    debug: (message: string, meta?: LogMeta) =>
      emit("debug", message, { ...bindings, ...(meta || {}) }),
    info: (message: string, meta?: LogMeta) =>
      emit("info", message, { ...bindings, ...(meta || {}) }),
    warn: (message: string, meta?: LogMeta) =>
      emit("warn", message, { ...bindings, ...(meta || {}) }),
    error: (message: string, meta?: LogMeta) =>
      emit("error", message, { ...bindings, ...(meta || {}) }),
  }),
};

// Backwards-compatible STATUS log for existing job monitors.
export function sendLog(msg: string) {
  console.log(
    JSON.stringify({
      chatId: CHAT_ID,
      type: "STATUS",
      message: msg,
    })
  );
}
