import path from "path";
import { readFile } from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";
import { logger } from "../../services/logger/logger.service.js";
export async function readFileImpl(ctx: JobContext, dirPath: string) {
  let fullPath: string;
  try {
    let normalizedPath = dirPath;
    if (normalizedPath.startsWith("/tmp/workspace")) {
      normalizedPath = normalizedPath.slice("/tmp/workspace".length);
    } else if (normalizedPath.startsWith("tmp/workspace")) {
      normalizedPath = normalizedPath.slice("tmp/workspace".length);
    }
    normalizedPath = normalizedPath.replace(/^[\/\\]+/, "");
    fullPath = path.join(ctx.workspace, normalizedPath);

    logger.info(`Reading file ${fullPath}`);

    const file = readFile(fullPath);
    return file;
  } catch (e) {
    logger.error(`Failed to read file ${dirPath}, err: ${e} }`);
    throw e;
  }
}
