type CleanupFn = () => Promise<void> | void;

const cleanups: CleanupFn[] = [];
let shuttingDown = false;
let shutdownPromise: Promise<void> | null = null;

export function registerCleanup(fn: CleanupFn) {
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
  if (reason) console.log("Shutting down: " + reason);

  const tasks = cleanups.map((fn) =>
    runCleanupWithTimeout(fn, timeoutMs).catch((err) => {
      console.error("Cleanup failed:", err && err.message ? err.message : err);
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
  console.log("Received SIGINT");
  shutdown(130, "SIGINT").catch((e) => console.error(e));
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM");
  shutdown(143, "SIGTERM").catch((e) => console.error(e));
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1, "unhandledRejection").catch((e) => console.error(e));
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  // Ensure cleanup runs and then exit with failure
  shutdown(1, "uncaughtException")
    .catch((e) => console.error(e))
    .finally(() => process.exit(1));
});

export function isShuttingDown() {
  return shuttingDown;
}
