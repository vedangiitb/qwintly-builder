import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getQwintlyCore } from "../services/core/qwintlyCore.service.js";
import { formatDurationMs } from "../utils/formatDuration.js";
import {
  defaultHeartbeatMessage,
  withStatusHeartbeat,
} from "../utils/withStatusHeartbeat.js";
import { isStepDone, markStepDone } from "./stepDone.js";

type StepFn<T> = () => Promise<T>;

export async function step<T>(
  name: string,
  fn: StepFn<T>,
  options?: { retries?: number; heartbeatIntervalMs?: number },
) {
  const core = await getQwintlyCore();
  const retries = options?.retries ?? 0;
  const totalAttempts = retries + 1;

  if (await isStepDone(name)) {
    console.log(`Skipping step ${name}`);
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const attemptLabel =
      totalAttempts > 1 ? ` (attempt ${attempt}/${totalAttempts})` : "";
    const startedAt = Date.now();

    try {
      await core.streamLog(
        `Started ${name}${attemptLabel}`,
        EVENT_TYPES.STEP_STARTED,
      );

      const result = await withStatusHeartbeat(fn, {
        intervalMs: options?.heartbeatIntervalMs ?? 30_000,
        eventType: EVENT_TYPES.STEP_STARTED,
        message: (elapsedMs) => defaultHeartbeatMessage(name, elapsedMs),
      });

      const elapsedMs = Date.now() - startedAt;
      await core.streamLog(
        `Done ${name} (${formatDurationMs(elapsedMs)})`,
        EVENT_TYPES.STEP_FINISHED,
        true,
      );
      await markStepDone(name);
      return result;
    } catch (err: any) {
      const elapsedMs = Date.now() - startedAt;
      if (attempt > retries) {
        const reason = err?.message ? String(err.message) : String(err);
        await core.streamLog(
          `Failed ${name} (after ${formatDurationMs(elapsedMs)}): ${reason}`,
          EVENT_TYPES.STEP_ERROR,
          true,
        );
        console.error(`Step failed: ${name}`, {
          attempt,
          totalAttempts,
          elapsedMs,
          error: err,
        });
        throw err;
      }

      await core.streamLog(
        `Retrying ${name} (attempt ${attempt + 1}/${totalAttempts})`,
        EVENT_TYPES.STEP_RETRY,
      );
    }
  }

  throw new Error("Unreachable");
}
