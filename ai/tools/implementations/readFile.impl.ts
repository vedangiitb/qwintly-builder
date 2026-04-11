import { readFile, stat } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../../services/logger/logger.service.js";
import { toWorkspacePath } from "../helpers/fileSystem.helpers.js";
import { sliceByLines } from "../helpers/format.helpers.js";

const DEFAULT_NOT_FOUND_RESPONSE = "not found";

export const readFileImpl = async (
  filePath: string,
  startLine?: number,
  endLine?: number,
) => {
  const ctx = getJobContext();
  const fullPath = toWorkspacePath(ctx.workspace, filePath);
  logger.info(`Tool read_file: ${fullPath}`);

  try {
    await stat(fullPath);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") {
      return DEFAULT_NOT_FOUND_RESPONSE;
    }
    throw err;
  }

  const content = await readFile(fullPath);
  return sliceByLines(content, startLine, endLine);
};
