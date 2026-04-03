import { logger } from "../services/logger/logger.service.js";
import { isStepDone } from "./stepDone.js";

type StepFn<T> = () => Promise<T>;

export async function step<T>(
  name: string,
  fn: StepFn<T>,
  options?: { retries?: number },
) {
  const retries = options?.retries ?? 0;

  if (await isStepDone(name)) {
    logger.info(`Skipping step ${name}`);
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      logger.status(`Started ${name}`);
      const result = await fn();
      logger.status(`Done ${name}`);
      return result;
    } catch (err: any) {
      if (attempt > retries) {
        logger.status(`Failed ${name}: ${err?.message || err}`);
        throw err;
      }
      logger.status(`Retrying ${name}`);
    }
  }
  throw new Error("Unreachable");
}
