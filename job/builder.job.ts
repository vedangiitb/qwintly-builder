import { ProjectRequestType } from "../data/project.constants.js";
import { runNewProjectFlow } from "../flows/newProject.flow.js";
import { runUpdateProjectFlow } from "../flows/updateProject.flow.js";
import { registerCleanup } from "../services/project/cleanup.service.js";
import { safeExit } from "../utils/gracefulShutdown.js";
import { createJobContext } from "./jobContext.js";

export async function runBuilderJob() {
  const ctx = createJobContext();

  registerCleanup(ctx);

  try {
    if (ctx.requestType === ProjectRequestType.NEW) {
      await runNewProjectFlow(ctx);
    } else if (ctx.requestType === ProjectRequestType.UPDATE) {
      await runUpdateProjectFlow(ctx);
    } else {
      throw new Error(`Unknown request type: ${ctx.requestType}`);
    }
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    await safeExit(1, err?.message || "Unknown error");
  }
}
