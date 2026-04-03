// job/stepState.ts
import { createFile, stat } from "../infra/fs/workspace.js";
import { getJobContext } from "./jobContext.js";

export async function isStepDone(step: string) {
  const ctx = getJobContext();
  try {
    await stat(`${ctx.workspace}/.step.${step}`);
    return true;
  } catch {
    return false;
  }
}

export async function markStepDone(step: string) {
  const ctx = getJobContext();
  await createFile(`${ctx.workspace}/.step.${step}`, "done");
}
