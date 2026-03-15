import { logger } from "./logger.js";

type CleanupFn = () => Promise<void> | void;

const cleanups: CleanupFn[] = [];
let shuttingDown = false;
let shutdownPromise: Promise<void> | null = null;

export function registerCleanupUtil(fn: CleanupFn) {
  cleanups.push(fn);
  return () => {
    const idx = cleanups.indexOf(fn);
    if (idx >= 0) cleanups.splice(idx, 1);
  };
}

async function runCleanupWithTimeout(fn: CleanupFn, timeoutMs: number) {
  return Promise.race([
    Promise.resolve().then(() => fn()),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("cleanup timeout")), timeoutMs)
    ),
  ]);
}

export async function shutdown(
  code = 0,
  reason?: string,
  timeoutMs = 5000
): Promise<void> {
  if (shuttingDown) return shutdownPromise || Promise.resolve();
  shuttingDown = true;
  process.exitCode = code;
  if (reason) logger.info("Shutting down", { reason, code });

  const tasks = cleanups.map((fn) =>
    runCleanupWithTimeout(fn, timeoutMs).catch((err) => {
      logger.error("Cleanup failed", {
        err: err && err.message ? err.message : err,
      });
    })
  );

  shutdownPromise = Promise.all(tasks).then(() => undefined);
  await shutdownPromise;
}

export async function safeExit(code = 0, reason?: string) {
  await shutdown(code, reason);
  // exit after cleanup completes
  process.exit(code);
}

// Register global handlers on import so the process becomes resilient to signals
process.on("SIGINT", () => {
  logger.warn("Received SIGINT");
  shutdown(130, "SIGINT").catch((e) => logger.error("SIGINT shutdown failed", { err: e }));
});

process.on("SIGTERM", () => {
  logger.warn("Received SIGTERM");
  shutdown(143, "SIGTERM").catch((e) => logger.error("SIGTERM shutdown failed", { err: e }));
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled rejection", { err: reason });
  shutdown(1, "unhandledRejection").catch((e) =>
    logger.error("Unhandled rejection shutdown failed", { err: e })
  );
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught exception", { err });
  // Ensure cleanup runs and then exit with failure
  shutdown(1, "uncaughtException")
    .catch((e) => logger.error("Uncaught exception shutdown failed", { err: e }))
    .finally(() => process.exit(1));
});

export function isShuttingDown() {
  return shuttingDown;
}
