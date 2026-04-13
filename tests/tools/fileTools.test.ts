import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createWorkspaceToolImpls } from "qwintly-ai-core";

const createTestDeps = (workspaceRoot: string) => {
  const sortDirents = (a: any, b: any) => {
    const aIsDir = a.isDirectory();
    const bIsDir = b.isDirectory();
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  };

  return {
    workspaceRoot,
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

test("file tools: read, create, delete within workspace", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tool-workspace-"));

  try {
    const { readFileImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    const fileName = "notes.txt";
    const fullPath = path.join(tmpRoot, fileName);
    await fs.writeFile(fullPath, "line1\nline2\nline3\n", "utf-8");

    assert.equal(await readFileImpl(fileName), "line1\nline2\nline3\n");
    assert.equal(await readFileImpl(fileName, 2, 2), "line2");
    assert.equal(await readFileImpl(fullPath, 1, 1), "line1");
    assert.equal(await readFileImpl("/tmp/workspace/notes.txt", 3, 3), "line3");

    assert.equal(await readFileImpl("missing.txt"), "not found");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
