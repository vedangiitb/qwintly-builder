// infra/fs/workspace.ts
import fs from "fs/promises";
import path from "path";
import { logger } from "../../services/logger/logger.service.js";
import { Dirent } from "fs";

export async function createFolder(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function removeFolder(path: string) {
  await fs.rm(path, { recursive: true, force: true });
}

export async function createFile(path: string, content: string) {
  try {
    await fs.writeFile(path, content, "utf-8");
  } catch (err) {
    throw err;
  }
}

export async function removeFile(path: string) {
  await fs.rm(path, { force: true });
}

export async function copyFile(from: string, to: string) {
  await fs.copyFile(from, to);
}

export async function stat(path: string) {
  return await fs.stat(path);
}

export async function readDir(path: string) {
  return await fs.readdir(path, { withFileTypes: true });
}

const sortDirents = (a: Dirent, b: Dirent) => {
  const aIsDir = a.isDirectory();
  const bIsDir = b.isDirectory();
  if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

export async function safeReadDir(dir: string) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries.sort(sortDirents);
  } catch {
    return [];
  }
}

export async function readFile(path: string) {
  try {
    return await fs.readFile(path, "utf-8");
  } catch (err) {
    const code = (err as NodeJS.ErrnoException | null)?.code;
    if (code !== "ENOENT") {
      const errMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Error while reading file "${path}": ${errMessage}`);
    }
    return "";
  }
}

export async function readTsFiles(dir: string, results: any[] = []) {
  try {
    await fs.access(dir); // existence check
  } catch {
    return results; // directory doesn't exist → skip
  }

  const entries = await fs.readdir(dir);
  const ALLOWED_EXT = [".ts", ".tsx"];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = await fs.stat(fullPath);

    if (stat.isDirectory()) {
      readTsFiles(fullPath, results);
    } else if (ALLOWED_EXT.includes(path.extname(entry))) {
      results.push({
        name: entry,
        path: fullPath,
        description: filterDescription(await fs.readFile(fullPath, "utf-8")),
      });
    }
  }

  return results;
}

export const filterDescription = (content: string): string => {
  if (!content) return "";
  const DESC_REGEX = /DESC_START([\s\S]*?)DESC_END/g;
  const match = DESC_REGEX.exec(content);
  DESC_REGEX.lastIndex = 0;

  if (!match) return "";

  return match[1].trim();
};
