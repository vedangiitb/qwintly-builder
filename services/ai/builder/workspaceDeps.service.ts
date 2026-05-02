import { WorkspaceDeps } from "@vedangiitb/qwintly-core";
import type { Dirent } from "node:fs";
import fs from "node:fs/promises";
import { getJobContext } from "../../../job/jobContext.js";

const sortDirents = (a: Dirent, b: Dirent) => {
  const aIsDir = a.isDirectory();
  const bIsDir = b.isDirectory();
  if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
};

export const createWorkspaceDeps = (): WorkspaceDeps => {
  const ctx = getJobContext();

  return {
    workspaceRoot: ctx.workspace,
    fs: {
      readFile: async (p: string) => await fs.readFile(p, "utf-8"),
      writeFile: async (p: string, content: string) =>
        await fs.writeFile(p, content, "utf-8"),
      mkdirp: async (dir: string) => {
        await fs.mkdir(dir, { recursive: true });
      },
      rmFile: async (p: string) => await fs.rm(p, { force: true }),
      stat: async (p: string) => await fs.stat(p),
      safeReadDir: async (dir: string) => {
        try {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          return entries.sort(sortDirents);
        } catch {
          return [];
        }
      },
    },
  };
};
