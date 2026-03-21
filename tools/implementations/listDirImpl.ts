import path from "node:path";
import { readDir } from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";

export type ListDirEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
};

export const listDirImpl = async (
  ctx: JobContext,
  dirPath: string
): Promise<ListDirEntry[]> => {
  const fullPath = path.isAbsolute(dirPath)
    ? dirPath
    : path.join(ctx.workspace, dirPath);

  const entries = await readDir(fullPath);
  return entries.map((entry) => ({
    name: entry.name,
    path: path.join(fullPath, entry.name),
    type: entry.isDirectory() ? "dir" : "file",
  }));
};
