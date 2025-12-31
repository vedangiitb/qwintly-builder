import { runProjectFlow } from "../flows/runProject.flow.js";
import { registerCleanup } from "../services/project/cleanup.service.js";
import { safeExit } from "../utils/gracefulShutdown.js";
import { createJobContext } from "./jobContext.js";

export async function runBuilderJob() {
  const ctx = createJobContext();

  registerCleanup(ctx);

  try {
    await runProjectFlow(ctx);
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    await safeExit(1, err?.message || "Unknown error");
  }
}
