// infra/fs/workspace.ts
import fs from "fs/promises";
import path from "path";

export async function createFolder(path: string) {
  await fs.mkdir(path, { recursive: true });
}

export async function removeFolder(path: string) {
  await fs.rm(path, { recursive: true, force: true });
}

export async function createFile(path: string, content: string) {
  await fs.writeFile(path, content, "utf-8");
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

export async function readFile(path: string) {
  return await fs.readFile(path, "utf-8");
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

const filterDescription = (content: string): string => {
  const DESC_REGEX = /DESC_START([\s\S]*?)DESC_END/g;
  const match = DESC_REGEX.exec(content);
  DESC_REGEX.lastIndex = 0;

  if (!match) return "";

  return match[1].trim();
};
