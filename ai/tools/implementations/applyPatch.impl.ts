import { createFile, readFile, stat, removeFile } from "../../../infra/fs/workspace.js";
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

      if (op.kind === "delete") {
        logger.info(`Tool apply_patch (delete): ${fullPath}`);
        try {
          await removeFile(fullPath);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Delete File failed for "${op.filePath}": ${message}`);
        }
        continue;
      }

      if (op.kind === "add") {
        logger.info(`Tool apply_patch (add): ${fullPath}`);
        try {
          // For add, we don't check for existence (or we can, to prevent overwrite if desired,
          // but createFile usually overwrites).
          const { content: after } = applyHunksToContent("", op.hunks);
          await createFile(fullPath, after);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Add File failed for "${op.filePath}": ${message}`);
        }
        continue;
      }

      if (op.kind === "update") {
        logger.info(`Tool apply_patch (update): ${fullPath}`);
        try {
          try {
            await stat(fullPath);
          } catch (err) {
            const code = (err as NodeJS.ErrnoException | null)?.code;
            if (code === "ENOENT") {
              throw new Error(`"${op.filePath}" not found.`);
            }
            throw err;
          }

          const before = await readFile(fullPath);
          const { content: after } = applyHunksToContent(before, op.hunks);
          await createFile(fullPath, after);
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          throw new Error(`Update File failed for "${op.filePath}": ${message}`);
        }
      }
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Tool apply_patch failed: ${message}`);
    return { success: false, error: message };
  }
}
