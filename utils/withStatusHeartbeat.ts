import { logger, StatusMeta } from "../services/logger/logger.service.js";
import { formatDurationMs } from "./formatDuration.js";

type HeartbeatOptions = {
  intervalMs?: number;
  meta?: StatusMeta;
  message: (elapsedMs: number) => string;
};

export async function withStatusHeartbeat<T>(
  fn: () => Promise<T>,
  options: HeartbeatOptions,
): Promise<T> {
  const intervalMs = options.intervalMs ?? 30_000;
  const startedAt = Date.now();

  let timer: NodeJS.Timeout | null = null;
  if (intervalMs > 0) {
    timer = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      logger.status(options.message(elapsedMs), {
        ...(options.meta ?? {}),
        elapsedMs,
        heartbeat: true,
      });
    }, intervalMs);
    timer.unref();
  }

  try {
    return await fn();
  } finally {
    if (timer) clearInterval(timer);
  }
}

export function defaultHeartbeatMessage(stepName: string, elapsedMs: number) {
  return `Still working on ${stepName} (${formatDurationMs(elapsedMs)} elapsed)`;
}

