import { removeFile, removeFolder } from "../../infra/fs/workspace.js";
import { getJobContext } from "../../job/jobContext.js";
import { registerCleanupUtil } from "../../utils/gracefulShutdown.js";
import { logger } from "../logger/logger.service.js";

export const registerCleanup = () => {
  const ctx = getJobContext();
  const workspace = ctx.workspace;
  const zipPath = ctx.zipPath;
  registerCleanupUtil(async () => {
    try {
      await removeFolder(workspace);
      logger.info(`Workspace removed ${workspace}`);
    } catch (e) {
      logger.warn(`Failed to remove Workspace ${workspace}. Err:${e}`);
    }
  });

  registerCleanupUtil(async () => {
    try {
      await removeFile(zipPath);
      logger.info(`Zip file removed ${zipPath}`);
    } catch (e) {
      logger.warn(
        `Failed to remove up zip file ${zipPath} from workspace. Err:${e}`,
      );
    }
  });
};
