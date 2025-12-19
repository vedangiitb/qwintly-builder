import path from "path";
import { readDir } from "../infra/fs/workspace.js";

export async function readStructure(
  dir: string,
  prefix = ""
): Promise<string[]> {
  const entries = await readDir(dir);
  const result: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(prefix, entry.name);

    result.push(relPath);

    if (entry.isDirectory()) {
      result.push(...(await readStructure(fullPath, relPath)));
    }
  }

  return result;
}
