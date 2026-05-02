import { removeFile, removeFolder } from "@vedangiitb/qwintly-core";
import { getJobContext } from "../../job/jobContext.js";
import { registerCleanupUtil } from "../../utils/gracefulShutdown.js";

export const registerCleanup = () => {
  const ctx = getJobContext();
  const workspace = ctx.workspace;
  const zipPath = ctx.zipPath;
  registerCleanupUtil(async () => {
    try {
      await removeFolder(workspace);
      console.log(`Workspace removed ${workspace}`);
    } catch (e) {
      console.warn(`Failed to remove Workspace ${workspace}. Err:${e}`);
    }
  });

  registerCleanupUtil(async () => {
    try {
      await removeFile(zipPath);
      console.log(`Zip file removed ${zipPath}`);
    } catch (e) {
      console.warn(
        `Failed to remove up zip file ${zipPath} from workspace. Err:${e}`,
      );
    }
  });
};
