import { getJobContext } from "../../job/jobContext.js";

type LogType = "STATUS" | "INFO" | "WARN" | "ERROR";
type Severity =
  | "DEFAULT"
  | "DEBUG"
  | "INFO"
  | "NOTICE"
  | "WARNING"
  | "ERROR"
  | "CRITICAL"
  | "ALERT"
  | "EMERGENCY";

export type LogMeta = Record<string, unknown>;

export type StatusPhase =
  | "fetch_inputs"
  | "clone"
  | "ai_plan"
  | "ai_codegen"
  | "validate"
  | "zip"
  | "upload"
  | "cleanup"
  | "done"
  | "failed";

export type StatusProgress = { current: number; total: number; unit: string };

export type StatusMeta = LogMeta & {
  phase?: StatusPhase;
  progress?: StatusProgress;
  elapsedMs?: number;
  iteration?: number;
  heartbeat?: boolean;
};

type ErrorLike = { name?: unknown; message?: unknown; stack?: unknown };

export const logger = {
  status: (message: string, meta?: StatusMeta) => emit(message, "STATUS", meta),
  info: (message: string, meta?: LogMeta) => emit(message, "INFO", meta),
  warn: (message: string, meta?: LogMeta) => emit(message, "WARN", meta),
  error: (message: string, metaOrError?: unknown, meta?: LogMeta) =>
    emitError(message, metaOrError, meta),
};

const emitError = (message: string, metaOrError?: unknown, meta?: LogMeta) => {
  const { error, mergedMeta } = normalizeErrorMeta(metaOrError, meta);
  emit(message, "ERROR", mergedMeta, error);
};

const emit = (
  message: string,
  type: LogType,
  meta?: LogMeta,
  error?: { name?: string; message?: string; stack?: string },
) => {
  const ctx = getJobContext();

  const log = JSON.stringify({
    message,
    type,
    severity: mapSeverity(type),
    ts: new Date().toISOString(),
    chatId: ctx?.chatId,
    sessionId: ctx?.sessionId,
    ...(meta ? { meta } : {}),
    ...(error ? { error } : {}),
  });

  if (type === "ERROR") {
    console.error(log);
  } else if (type === "WARN") {
    console.warn(log);
  } else {
    console.log(log);
  }
};

const mapSeverity = (type: LogType): Severity => {
  if (type === "ERROR") return "ERROR";
  if (type === "WARN") return "WARNING";
  if (type === "STATUS") return "NOTICE";
  return "INFO";
};

const isErrorLike = (value: unknown): value is ErrorLike => {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return "message" in v || "stack" in v || "name" in v;
};

const stringifyIfString = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  return undefined;
};

const normalizeErrorMeta = (metaOrError?: unknown, meta?: LogMeta) => {
  if (metaOrError instanceof Error || isErrorLike(metaOrError)) {
    const e = metaOrError as ErrorLike;
    const error = {
      name: stringifyIfString(e.name) ?? "Error",
      message: stringifyIfString(e.message),
      stack: stringifyIfString(e.stack),
    };
    return { error, mergedMeta: meta };
  }

  const mergedMeta: LogMeta | undefined =
    metaOrError && typeof metaOrError === "object"
      ? { ...(metaOrError as LogMeta), ...(meta ?? {}) }
      : meta;

  return { error: undefined, mergedMeta };
};
