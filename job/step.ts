import { getQwintlyCore } from "../services/core/qwintlyCore.service.js";
import { isStepDone } from "./stepDone.js";
import { markStepDone } from "./stepDone.js";
import {
  defaultHeartbeatMessage,
  withStatusHeartbeat,
} from "../utils/withStatusHeartbeat.js";
import { formatDurationMs } from "../utils/formatDuration.js";

type StepFn<T> = () => Promise<T>;

export async function step<T>(
  name: string,
  fn: StepFn<T>,
  options?: { retries?: number; heartbeatIntervalMs?: number },
) {
  const core = getQwintlyCore();
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
      await core.streamLog(`Started ${name}${attemptLabel}`, "step_started" as any);

      const result = await withStatusHeartbeat(fn, {
        intervalMs: options?.heartbeatIntervalMs ?? 30_000,
        eventType: "step_started",
        message: (elapsedMs) => defaultHeartbeatMessage(name, elapsedMs),
      });

      const elapsedMs = Date.now() - startedAt;
      await core.streamLog(
        `Done ${name} (${formatDurationMs(elapsedMs)})`,
        "step_finished" as any,
      );
      await markStepDone(name);
      return result;
    } catch (err: any) {
      const elapsedMs = Date.now() - startedAt;
      if (attempt > retries) {
        const reason = err?.message ? String(err.message) : String(err);
        await core.streamLog(
          `Failed ${name} (after ${formatDurationMs(elapsedMs)}): ${reason}`,
          "step_error" as any,
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
        "step_retry" as any,
      );
    }
  }

  throw new Error("Unreachable");
}

