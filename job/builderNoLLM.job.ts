import { runProjectNoLLMFlow } from "../flows/runProjectNoLLM.flow.js";
import { registerCleanup } from "../services/project/cleanup.service.js";
import { safeExit } from "../utils/gracefulShutdown.js";
import { createJobContext } from "./jobContext.js";

export async function runBuilderNoLLMJob() {
  const ctx = createJobContext();

  registerCleanup(ctx);

  try {
    await runProjectNoLLMFlow(ctx);
    await safeExit(0, "SUCCESS");
  } catch (err: any) {
    await safeExit(1, err?.message || "Unknown error");
  }
}
