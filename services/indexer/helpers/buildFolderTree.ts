import path from "node:path";
import { indexing } from "../data/configs.constants.js";
import { safeReadDir } from "../../../infra/fs/workspace.js";
import { getJobContext } from "../../../job/jobContext.js";

const INCLUDED_EXTENSIONS = new Set(
  indexing.includeExtensions.map((ext) => ext.toLowerCase()),
);

const EXCLUDED_DIRS = new Set(
  indexing.excludeDirectories.map((dir) => dir.toLowerCase()),
);

const isExcludedDir = (dirName: string) =>
  EXCLUDED_DIRS.has(dirName.toLowerCase());

const toPosixRel = (rootDir: string, fullPath: string) =>
  path.relative(rootDir, fullPath).replace(/\\/g, "/");

export const buildFolderTree = async (rootDir?: string): Promise<string> => {
  const ctx = getJobContext();
  const effectiveRoot = rootDir ?? ctx.workspace;

  const lines: string[] = [];
  const indentForDepth = (depth: number) => (depth <= 1 ? "" : "  ");

  const walk = async (dir: string, depth: 1 | 2) => {
    const dirEntries = await safeReadDir(dir);

    for (const entry of dirEntries) {
      if (!entry.isDirectory() && !entry.isFile()) continue;

      const fullPath = path.join(dir, entry.name);
      const indent = indentForDepth(depth);

      if (entry.isDirectory()) {
        if (isExcludedDir(entry.name)) continue;
        const rel = toPosixRel(effectiveRoot, fullPath);
        if (!rel) continue;
        lines.push(`${indent}/${rel}`);

        if (depth === 1) {
          await walk(fullPath, 2);
        }

        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (!INCLUDED_EXTENSIONS.has(ext)) continue;
      lines.push(`${indent}${entry.name}`);
    }
  };

  await walk(effectiveRoot, 1);
  return lines.join("\n");
};
