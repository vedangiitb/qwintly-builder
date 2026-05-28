import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../services/core/qwintlyCore.service.js";
import { formatDurationMs } from "./formatDuration.js";

type HeartbeatOptions = {
  intervalMs?: number;
  eventType?: string;
  message: (elapsedMs: number) => string;
};

export async function withStatusHeartbeat<T>(
  fn: () => Promise<T>,
  options: HeartbeatOptions,
): Promise<T> {
  const intervalMs = options.intervalMs ?? 30_000;
  const startedAt = Date.now();

  const core = await getQwintlyCore();

  let timer: NodeJS.Timeout | null = null;
  if (intervalMs > 0) {
    timer = setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      core
        .streamLog(
          options.message(elapsedMs),
          (options.eventType ?? EVENT_TYPES.STEP_STARTED) as any,
        )
        .catch((err) => console.warn("Heartbeat streamLog failed", err));
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
