// job/stepState.ts
import { createFile, stat } from "../infra/fs/workspace.js";
import { JobContext } from "./jobContext.js";

export async function isStepDone(ctx: JobContext, step: string) {
  try {
    await stat(`${ctx.workspace}/.step.${step}`);
    return true;
  } catch {
    return false;
  }
}

export async function markStepDone(ctx: JobContext, step: string) {
  await createFile(`${ctx.workspace}/.step.${step}`, "done");
}
