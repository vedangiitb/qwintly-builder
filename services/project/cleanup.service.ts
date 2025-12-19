import { removeFile, removeFolder } from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";
import { registerCleanupUtil } from "../../utils/gracefulShutdown.js";

export const registerCleanup = (ctx: JobContext) => {
  const workspace = ctx.workspace;
  const zipPath = ctx.zipPath;
  registerCleanupUtil(async () => {
    try {
      await removeFolder(workspace);
      console.log("Workspace removed: " + workspace);
    } catch (e) {
      console.warn("Failed to remove workspace: " + e);
    }
  });

  registerCleanupUtil(async () => {
    try {
      await removeFile(zipPath);
    } catch (e) {
      console.error(e || "Error occured while cleaning up zip file");
    }
  });
};
