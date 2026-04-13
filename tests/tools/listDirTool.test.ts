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

test("list_dir: lists directories first, then files (depth=1)", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "list-dir-"));

  try {
    const { listDirImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.mkdir(path.join(tmpRoot, "b"), { recursive: true });
    await fs.mkdir(path.join(tmpRoot, "a"), { recursive: true });
    await fs.writeFile(path.join(tmpRoot, "z.txt"), "z\n", "utf-8");
    await fs.writeFile(path.join(tmpRoot, "a.txt"), "a\n", "utf-8");

    const result = await listDirImpl(".", 1);
    assert.equal(result, ["/a", "/b", "a.txt", "z.txt"].join("\n"));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("list_dir: traverses up to depth=2 and clamps depth range", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "list-dir-"));

  try {
    const { listDirImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    const bDir = path.join(tmpRoot, "b");
    const dDir = path.join(bDir, "d");
    await fs.mkdir(dDir, { recursive: true });
    await fs.writeFile(path.join(bDir, "c.txt"), "c\n", "utf-8");
    await fs.writeFile(path.join(dDir, "e.txt"), "e\n", "utf-8");

    const depth2 = await listDirImpl(".", 2);
    assert.equal(depth2, ["/b", "  /d", "  c.txt"].join("\n"));

    const depth0Clamped = await listDirImpl(".", 0);
    assert.equal(depth0Clamped, "/b");

    const depth99Clamped = await listDirImpl(".", 99);
    assert.equal(
      depth99Clamped,
      ["/b", "  /d", "    e.txt", "  c.txt"].join("\n"),
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("list_dir: handles missing paths and non-directories", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "list-dir-"));

  try {
    const { listDirImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    assert.equal(await listDirImpl("missing", 1), "not found");

    await fs.writeFile(path.join(tmpRoot, "file.txt"), "x\n", "utf-8");
    assert.equal(await listDirImpl("file.txt", 1), "not a directory: file.txt");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
