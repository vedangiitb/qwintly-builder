import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { runProjectFlow } from "../flows/runProject.flow.js";
import { getQwintlyCore } from "../services/core/qwintlyCore.service.js";
import { registerCleanup } from "../services/project/cleanup.service.js";
import { finishGenerationSession } from "../services/project/genSession.service.js";
import { safeExit } from "../utils/gracefulShutdown.js";
import { getJobContext } from "./jobContext.js";

export async function runBuilderJob() {
  const ctx = getJobContext();
  const core = await getQwintlyCore();
  let success = false;
  let exitCode = 0;
  let exitMessage = "SUCCESS";
  try {
    registerCleanup();
    await runProjectFlow();
    await core.streamLog(
      "Generation Successfully Completed",
      EVENT_TYPES.GENERATION_COMPLETED,
      true,
    );
    success = true;
  } catch (err: any) {
    console.error("Builder job failed", err);
    await core.streamLog(
      "Generation failed",
      EVENT_TYPES.GENERATION_FAILED,
      true,
    );
    exitCode = 1;
  } finally {
    await finishGenerationSession(ctx.sessionId, success);
    await safeExit(exitCode, exitMessage);
  }
}
