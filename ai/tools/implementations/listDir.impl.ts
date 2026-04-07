import path from "node:path";
import { safeReadDir, stat } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";
import { logger } from "../../../services/logger/logger.service.js";
import { toWorkspacePath } from "../helpers/fileSystem.helpers.js";

const DEFAULT_NOT_FOUND_RESPONSE = "not found";
const MAX_LINES = 500;

export async function listDirImpl(dirPath: string, depth: number) {
  const ctx = getJobContext();
  const fullPath = toWorkspacePath(ctx.workspace, dirPath);
  logger.info(`Tool list_dir: ${fullPath} (depth=${depth})`);

  const effectiveDepth = Math.max(1, Math.min(3, depth ?? 1)) as 1 | 2 | 3;

  try {
    const st = await stat(fullPath);
    if (!st.isDirectory()) {
      return `not a directory: ${dirPath}`;
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") {
      return DEFAULT_NOT_FOUND_RESPONSE;
    }
    throw err;
  }

  const lines: string[] = [];

  const walk = async (dir: string, currentDepth: number, prefix: string) => {
    if (lines.length >= MAX_LINES) return;
    const entries = await safeReadDir(dir);

    for (const entry of entries) {
      if (lines.length >= MAX_LINES) return;
      if (!entry.isDirectory() && !entry.isFile()) continue;

      const isDir = entry.isDirectory();
      const displayName = isDir ? `/${entry.name}` : entry.name;
      const line = prefix ? `${prefix}${displayName}` : displayName;
      lines.push(line);

      if (isDir && currentDepth < effectiveDepth) {
        await walk(
          path.join(dir, entry.name),
          currentDepth + 1,
          `${prefix}  `,
        );
      }
    }
  };

  await walk(fullPath, 1, "");

  if (lines.length >= MAX_LINES) {
    lines.push("... truncated ...");
  }

  return lines.join("\n");
}

