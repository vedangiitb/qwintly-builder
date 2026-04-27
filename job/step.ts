import { logger } from "../services/logger/logger.service.js";
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
  const retries = options?.retries ?? 0;
  const totalAttempts = retries + 1;

  if (await isStepDone(name)) {
    logger.info(`Skipping step ${name}`);
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    const attemptLabel =
      totalAttempts > 1 ? ` (attempt ${attempt}/${totalAttempts})` : "";
    const startedAt = Date.now();
    const phase = guessPhaseFromName(name);
    try {
      logger.status(`Started ${name}${attemptLabel}`, {
        phase,
      });

      const result = await withStatusHeartbeat(fn, {
        intervalMs: options?.heartbeatIntervalMs ?? 30_000,
        meta: { phase },
        message: (elapsedMs) => defaultHeartbeatMessage(name, elapsedMs),
      });

      const elapsedMs = Date.now() - startedAt;
      logger.status(`Done ${name} (${formatDurationMs(elapsedMs)})`, {
        phase,
        elapsedMs,
      });
      await markStepDone(name);
      return result;
    } catch (err: any) {
      const elapsedMs = Date.now() - startedAt;
      if (attempt > retries) {
        const reason = err?.message ? String(err.message) : String(err);
        logger.status(
          `Failed ${name} (after ${formatDurationMs(elapsedMs)}): ${reason}`,
          { phase: "failed", elapsedMs },
        );
        logger.error(`Step failed: ${name}`, err, {
          step: name,
          attempt,
          totalAttempts,
          elapsedMs,
        });
        throw err;
      }
      logger.status(`Retrying ${name} (attempt ${attempt + 1}/${totalAttempts})`, {
        phase,
        elapsedMs,
      });
    }
  }
  throw new Error("Unreachable");
}

const guessPhaseFromName = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("plan task")) return "fetch_inputs";
  if (n.includes("project context")) return "fetch_inputs";
  if (n.includes("clon") || n.includes("template") || n.includes("snapshot"))
    return "clone";
  if (n.includes("builder ai")) return "ai_codegen";
  if (n.includes("building project info")) return "ai_codegen";
  if (n.includes("zipping")) return "zip";
  if (n.includes("upload")) return "upload";
  return undefined;
};
