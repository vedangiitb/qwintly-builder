import { createFile, readFile, stat } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../../services/logger/logger.service.js";
import { toWorkspacePath } from "../helpers/fileSystem.helpers.js";
import {
  applyHunksToContent,
  isTextFilePath,
  parseApplyPatch,
} from "../helpers/applyPatch.helpers.js";

export async function applyPatchImpl(patchString: string) {
  try {
    const ctx = getJobContext();
    const operations = parseApplyPatch(patchString);

    for (const op of operations) {
      if (!isTextFilePath(op.filePath)) {
        throw new Error(
          `Binary or unsupported file type in patch: "${op.filePath}"`,
        );
      }

      const fullPath = toWorkspacePath(ctx.workspace, op.filePath);
      logger.info(`Tool apply_patch (update): ${fullPath}`);

      try {
        await stat(fullPath);
      } catch (err) {
        const code = (err as NodeJS.ErrnoException | null)?.code;
        if (code === "ENOENT") {
          throw new Error(`Update File failed: "${op.filePath}" not found.`);
        }
        throw err;
      }

      const before = await readFile(fullPath);
      const { content: after } = applyHunksToContent(before, op.hunks);
      await createFile(fullPath, after);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Tool apply_patch failed: ${message}`);
    return { success: false, error: message };
  }
}
