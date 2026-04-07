import { removeFile } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../../services/logger/logger.service.js";
import { toWorkspacePath } from "../helpers/fileSystem.helpers.js";

export async function deleteFileImpl(filePath: string) {
  try {
    const ctx = getJobContext();
    const fullPath = toWorkspacePath(ctx.workspace, filePath);
    logger.info(`Tool delete_file: ${fullPath}`);

    await removeFile(fullPath);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Tool delete_file failed for "${filePath}": ${message}`);
    return { success: false, error: message };
  }
}
