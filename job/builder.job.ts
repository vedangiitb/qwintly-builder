import { runProjectFlow } from "../flows/runProject.flow.js";
import { registerCleanup } from "../services/project/cleanup.service.js";
import { safeExit } from "../utils/gracefulShutdown.js";

export async function runBuilderJob() {
  try {
    registerCleanup();
    await runProjectFlow();
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    await safeExit(1, err?.message || "Unknown error");
  }
}
