import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createPatch } from "diff";
import { createTestContext } from "../helpers/createTestContext.js";
import { readFileImpl } from "../../tools/implementations/readFileImpl.js";
import { writeCode } from "../../tools/implementations/writeCodeImpl.js";
import { applyPatchImpl } from "../../tools/implementations/applyPatchImpl.js";
import { listDirImpl } from "../../tools/implementations/listDirImpl.js";

test("file tools: read, write, patch, list", async () => {
  const { ctx, workspace, cleanup } = await createTestContext();

  try {
    await writeCode(ctx, "notes.txt", "// leading\nconst a = 1;", "test write");

    const readContent = await readFileImpl(ctx, "notes.txt");
    assert.match(readContent, /DESC_START/);
    assert.match(readContent, /const a = 1/);

    const oldContent = readContent;
    const newContent = oldContent.replace("const a = 1;", "const a = 2;");
    const patch = createPatch("notes.txt", oldContent, newContent);

    await applyPatchImpl(ctx, {
      path: "notes.txt",
      patch,
      description: "update value",
    });

    const patched = await readFileImpl(ctx, "notes.txt");
    assert.match(patched, /const a = 2/);

    await applyPatchImpl(ctx, {
      path: "scratch",
      operation: "mkdir",
    });

    await fs.writeFile(path.join(workspace, "scratch", "a.txt"), "hello", "utf-8");

    const entries = await listDirImpl(ctx, "scratch");
    const names = entries.map((entry) => entry.name).sort();
    assert.deepEqual(names, ["a.txt"]);
  } finally {
    await cleanup();
  }
});
