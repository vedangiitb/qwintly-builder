import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../job/jobContext.js";
import { getQwintlyCore } from "../core/qwintlyCore.service.js";

export const syncEditOps = async () => {
  const ctx = getJobContext();
  if (!ctx.prevSessionId) return;
  const core = await getQwintlyCore();

  try {
    await core.syncEditOps(ctx.prevSessionId, ctx.sessionId);
  } catch (err) {
    await core.streamLog(
      "Failed to sync edit ops, using previous snapshot",
      EVENT_TYPES.STEP_ERROR,
      true,
    );
  }
};
