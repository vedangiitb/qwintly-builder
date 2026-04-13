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

test("search: returns matches with file:line and content", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "search-"));

  try {
    const { searchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    const unique = `UNIQUE_TOKEN_${Date.now()}`;
    await fs.writeFile(path.join(tmpRoot, "a.txt"), `hello ${unique}\n`, "utf-8");
    await fs.writeFile(
      path.join(tmpRoot, "b.txt"),
      `other line\n${unique}\n`,
      "utf-8",
    );

    const results = await searchImpl(unique);
    assert.ok(results.length >= 1);
    assert.ok(
      results.some((r) => r.path.includes("a.txt:1") || r.path.includes("b.txt:2")),
    );
    assert.ok(results.some((r) => r.content.includes(unique)));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("search: returns [] for empty query and no matches", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "search-"));

  try {
    const { searchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "hello\n", "utf-8");

    assert.deepEqual(await searchImpl(""), []);
    assert.deepEqual(await searchImpl("   "), []);
    assert.deepEqual(await searchImpl("nope_should_not_exist_123456"), []);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("search: returns [] for invalid rg queries (does not throw)", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "search-"));

  try {
    const { searchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "hello\n", "utf-8");
    const results = await searchImpl("(*");
    assert.deepEqual(results, []);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
