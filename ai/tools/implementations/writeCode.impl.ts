import path from "node:path";
import { createFile, createFolder } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../../services/logger/logger.service.js";
import { toWorkspacePath } from "../helpers/fileSystem.helpers.js";

export async function writeCodeImpl(
  filePath: string,
  code: string,
  description: string,
) {
  const ctx = getJobContext();
  const fullPath = toWorkspacePath(ctx.workspace, filePath);
  logger.info(`Tool write_code: ${fullPath}`);
  logger.info(`Tool write_code description: ${description.slice(0, 500)}`);

  await createFolder(path.dirname(fullPath));
  await createFile(fullPath, code ?? "");
  return { ok: true };
}

