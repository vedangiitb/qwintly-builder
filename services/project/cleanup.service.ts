import { removeFile, removeFolder } from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";
import { registerCleanupUtil } from "../../utils/gracefulShutdown.js";
import { logger } from "../../utils/logger.js";

export const registerCleanup = (ctx: JobContext) => {
  const workspace = ctx.workspace;
  const zipPath = ctx.zipPath;
  registerCleanupUtil(async () => {
    try {
      await removeFolder(workspace);
      logger.info("Workspace removed", { workspace });
    } catch (e) {
      logger.warn("Failed to remove workspace", { workspace, err: e });
    }
  });

  registerCleanupUtil(async () => {
    try {
      await removeFile(zipPath);
    } catch (e) {
      logger.error("Failed to clean up zip file", { zipPath, err: e });
    }
  });
};
