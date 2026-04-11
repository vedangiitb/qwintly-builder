import path from "node:path";
import { createFile, createFolder } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../../services/logger/logger.service.js";
import { toWorkspacePath } from "../helpers/fileSystem.helpers.js";

export async function writeFileImpl(filePath: string, content: string) {
  const ctx = getJobContext();
  const fullPath = toWorkspacePath(ctx.workspace, filePath);
  logger.info(`Tool write_file: ${fullPath}`);

  await createFolder(path.dirname(fullPath));
  await createFile(fullPath, content ?? "");
  return { ok: true };
}

