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

test("apply_patch: updates an existing text file", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "foo.txt"), "a\nb\nc\n", "utf-8");

    const patch = [
      "*** Begin Patch",
      "*** Update File: foo.txt",
      "@@",
      " a",
      "-b",
      "+bb",
      " c",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "foo.txt"), "utf-8"),
      "a\nbb\nc\n",
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: supports add/delete and updates files", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    // 1. Add File
    const addFilePatch = [
      "*** Begin Patch",
      "*** Add File: new.txt",
      "@@",
      "+hello",
      "*** End Patch",
      "",
    ].join("\n");

    const addRes = await applyPatchImpl(addFilePatch);
    assert.deepEqual(addRes, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "new.txt"), "utf-8"),
      "hello\n",
    );

    // 2. Update existing (already tested, but here too)
    const updatePatch = [
      "*** Begin Patch",
      "*** Update File: new.txt",
      "@@",
      "-hello",
      "+hi",
      "*** End Patch",
      "",
    ].join("\n");
    await applyPatchImpl(updatePatch);
    assert.equal(await fs.readFile(path.join(tmpRoot, "new.txt"), "utf-8"), "hi\n");

    // 3. Delete File
    const deletePatch = [
      "*** Begin Patch",
      "*** Delete File: new.txt",
      "*** End Patch",
      "",
    ].join("\n");
    const delRes = await applyPatchImpl(deletePatch);
    assert.deepEqual(delRes, { success: true });

    try {
      await fs.stat(path.join(tmpRoot, "new.txt"));
      assert.fail("File should have been deleted");
    } catch (err) {
      assert.equal((err as any).code, "ENOENT");
    }
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: tolerates small formatting differences in context", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(
      path.join(tmpRoot, "quotes.ts"),
      "import Link from 'next/link';\nconst x = 1;\n",
      "utf-8",
    );

    const patch = [
      "*** Begin Patch",
      "*** Update File: quotes.ts",
      "@@",
      '-import Link from "next/link"',
      '+import Link from "next/navigation";',
      " const x = 1;",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "quotes.ts"), "utf-8"),
      'import Link from "next/navigation";\nconst x = 1;\n',
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: tolerates unprefixed lines when adding a file", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    const patch = [
      "*** Begin Patch",
      "*** Add File: plain.txt",
      "@@",
      "hello",
      "",
      "world",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "plain.txt"), "utf-8"),
      "hello\n\nworld\n",
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: preserves leading spaces when adding a file", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    const patch = [
      "*** Begin Patch",
      "*** Add File: indented.txt",
      "@@",
      "  a",
      "    b",
      "\t\tc",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "indented.txt"), "utf-8"),
      "  a\n    b\n\t\tc\n",
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: tolerates leading newlines before header", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "one\n", "utf-8");

    const patch = [
      "",
      "*** Begin Patch",
      "*** Update File: a.txt",
      "@@",
      "-one",
      "+two",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(await fs.readFile(path.join(tmpRoot, "a.txt"), "utf-8"), "two\n");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: tolerates missing footer", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "one\n", "utf-8");

    const patch = [
      "*** Begin Patch",
      "*** Update File: a.txt",
      "@@",
      "-one",
      "+two",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(await fs.readFile(path.join(tmpRoot, "a.txt"), "utf-8"), "two\n");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: tolerates unprefixed context lines in updates", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "one\ntwo\n", "utf-8");

    const patch = [
      "*** Begin Patch",
      "*** Update File: a.txt",
      "@@",
      "one",
      "-two",
      "+TWO",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(await fs.readFile(path.join(tmpRoot, "a.txt"), "utf-8"), "one\nTWO\n");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: tolerates indentation differences in update context", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "  keep\n  change\n", "utf-8");

    const patch = [
      "*** Begin Patch",
      "*** Update File: a.txt",
      "@@",
      "        keep",
      "-        change",
      "+        changed",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.deepEqual(res, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "a.txt"), "utf-8"),
      "  keep\n        changed\n",
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: rejects binary/unsupported file extensions", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

  try {
    const { applyPatchImpl } = createWorkspaceToolImpls(createTestDeps(tmpRoot));

    await fs.writeFile(
      path.join(tmpRoot, "image.png"),
      "not really binary\n",
      "utf-8",
    );
    const patch = [
      "*** Begin Patch",
      "*** Update File: image.png",
      "@@",
      " not really binary",
      "+x",
      "*** End Patch",
      "",
    ].join("\n");

    const res = await applyPatchImpl(patch);
    assert.equal(res.success, false);
    assert.ok((res.error ?? "").toLowerCase().includes("binary"));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
