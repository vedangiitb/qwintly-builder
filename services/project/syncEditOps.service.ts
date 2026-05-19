import { EVENT_TYPES } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../job/jobContext.js";
import { getQwintlyCore } from "../core/qwintlyCore.service.js";
import { uploadProjectSnapshot } from "../snapshot/uploadSnapshot.service.js";
import { zipProject } from "./zipProject.service.js";

export const syncEditOps = async () => {
  const ctx = getJobContext();
  if (!ctx.prevSessionId) return;
  const core = await getQwintlyCore();

  try {
    const isModified = await core.syncEditOps(ctx.prevSessionId, ctx.workspace);
    if (isModified) {
      await core.streamLog(
        "Successfully synced edit ops, uploading snapshot",
        EVENT_TYPES.STEP_FINISHED,
      );
      await zipProject();
      await uploadProjectSnapshot(ctx.prevSnapshotUploadPath);
    } else {
      console.log("No edit ops to sync");
    }
  } catch (err) {
    await core.streamLog(
      "Failed to sync edit ops, using previous snapshot",
      EVENT_TYPES.STEP_ERROR,
      true,
    );
  }
};
