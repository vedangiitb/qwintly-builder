import { logger } from "../services/logger/logger.service.js";

type CleanupFn = () => Promise<void> | void;

const cleanups: CleanupFn[] = [];
let shuttingDown = false;
let shutdownPromise: Promise<void> | null = null;
let lastSignalAtMs: number | null = null;

export function registerCleanupUtil(fn: CleanupFn) {
  cleanups.push(fn);
}

async function runCleanupWithTimeout(fn: CleanupFn, timeoutMs: number) {
  return Promise.race([
    Promise.resolve().then(() => fn()),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("cleanup timeout")), timeoutMs),
    ),
  ]);
}

export async function shutdown(
  code = 0,
  reason?: string,
  timeoutMs = 5000,
): Promise<void> {
  if (shuttingDown) return shutdownPromise || Promise.resolve();
  shuttingDown = true;
  process.exitCode = code;
  if (reason) logger.info(`Shutting down ${reason} with code ${code}`);

  const tasks = cleanups.map((fn) =>
    runCleanupWithTimeout(fn, timeoutMs).catch((err) => {
      logger.error(
        `Cleanup failed with error  ${err.message ? err.message : err}`,
      );
    }),
  );

  shutdownPromise = Promise.all(tasks).then(() => undefined);
  await shutdownPromise;
}

export async function safeExit(code = 0, reason?: string) {
  await shutdown(code, reason);
  // exit after cleanup completes
  process.exit(code);
}

function handleSignal(signal: "SIGINT" | "SIGTERM", code: number) {
  const now = Date.now();
  const isSecondSignal =
    lastSignalAtMs !== null && now - lastSignalAtMs < 1500;
  lastSignalAtMs = now;

  // Second Ctrl+C (or repeated SIGTERM) => exit immediately.
  if (shuttingDown || isSecondSignal) {
    logger.warn(`Received ${signal} again; forcing exit`);
    process.exit(code);
    return;
  }

  logger.warn(`Received ${signal}`);

  // Force-exit fallback in case something keeps the event loop alive.
  const forceExitTimer = setTimeout(() => {
    logger.error(`Timed out during ${signal} shutdown; forcing exit`);
    process.exit(code);
  }, 6500);
  forceExitTimer.unref();

  safeExit(code, signal).catch((err) => {
    logger.error(
      `${signal} shutdown failed with error ${err.message ? err.message : err}`,
    );
    process.exit(code);
  });
}

// Register global handlers on import so the process becomes resilient to signals
process.on("SIGINT", () => {
  handleSignal("SIGINT", 130);
});

process.on("SIGTERM", () => {
  handleSignal("SIGTERM", 143);
});

process.on("unhandledRejection", (reason) => {
  if (reason instanceof Error) {
    logger.error("Unhandled rejection", reason);
  } else {
    logger.error("Unhandled rejection", { reason: String(reason) });
  }
  shutdown(1, "unhandledRejection").catch((err) =>
    logger.error("Unhandled rejection shutdown failed", err),
  );
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", err);
  // Ensure cleanup runs and then exit with failure
  shutdown(1, "uncaughtException")
    .catch((err) => logger.error("Uncaught exception shutdown failed", err))
    .finally(() => process.exit(1));
});

export function isShuttingDown() {
  return shuttingDown;
}
