// job/stepState.ts
import { createFile, stat } from "@vedangiitb/qwintly-core";
import { getJobContext } from "./jobContext.js";
import os from "node:os";
import path from "node:path";
import { mkdir } from "node:fs/promises";

function safeStepId(step: string) {
  return step.replace(/[\\/]/g, "_");
}

async function getStepMarkerPath(step: string) {
  const ctx = getJobContext();
  const baseDir = path.join(
    os.tmpdir(),
    "qwintly-step-state",
    ctx.sessionId || ctx.chatId || "default",
  );
  await mkdir(baseDir, { recursive: true });
  return path.join(baseDir, `.step.${safeStepId(step)}`);
}

export async function isStepDone(step: string) {
  try {
    const markerPath = await getStepMarkerPath(step);
    await stat(markerPath);
    return true;
  } catch {
    return false;
  }
}

export async function markStepDone(step: string) {
  const markerPath = await getStepMarkerPath(step);
  await createFile(markerPath, "done");
}
