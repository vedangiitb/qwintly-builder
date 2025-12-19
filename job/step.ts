// job/step.ts
import { sendLog } from "../utils/logger.js";
import { JobContext } from "./jobContext.js";
import { isStepDone } from "./stepDone.js";

type StepFn<T> = () => Promise<T>;

export async function step<T>(
  ctx: JobContext,
  name: string,
  fn: StepFn<T>,
  options?: { retries?: number }
) {
  const retries = options?.retries ?? 0;

  if (await isStepDone(ctx, name)) {
    console.log(`SKIP ${name}`);
    return;
  }

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      sendLog(`Started ${name}`);
      const result = await fn();
      sendLog(`Done ${name}`);
      return result;
    } catch (err: any) {
      if (attempt > retries) {
        sendLog(`Failed ${name}: ${err?.message || err}`);
        throw err;
      }
      sendLog(`Retrying ${name}`);
    }
  }
  throw new Error("Unreachable");
}
