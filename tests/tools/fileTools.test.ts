import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setJobContext } from "../../job/jobContext.js";
import { readFileImpl } from "../../ai/tools/implementations/readFile.impl.js";
import { createFileImpl } from "../../ai/tools/implementations/createFile.impl.js";
import { deleteFileImpl } from "../../ai/tools/implementations/deleteFile.impl.js";

test("file tools: read, create, delete within workspace", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "tool-workspace-"));

  try {
    setJobContext({
      chatId: "test",
      sessionId: "test",
      requestType: "test",
      tasksPlanId: "test",
      workspace: tmpRoot,
      zipPath: path.join(tmpRoot, "tmp.zip"),
      snapshotBucket: "test",
      projectId: "test",
      templateBucket: "test",
      genSitesProjectId: "test",
    });

    const fileName = "notes.txt";
    const fullPath = path.join(tmpRoot, fileName);
    await fs.writeFile(fullPath, "line1\nline2\nline3\n", "utf-8");

    assert.equal(await readFileImpl(fileName), "line1\nline2\nline3\n");
    assert.equal(await readFileImpl(fileName, 2, 2), "line2");
    assert.equal(await readFileImpl(fullPath, 1, 1), "line1");
    assert.equal(await readFileImpl("/tmp/workspace/notes.txt", 3, 3), "line3");

    assert.equal(await readFileImpl("missing.txt"), "not found");

    const createRes = await createFileImpl("dir/new.txt");
    assert.deepEqual(createRes, { success: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "dir", "new.txt"), "utf-8"),
      "",
    );

    const createOutside = await createFileImpl("../outside.txt");
    assert.equal(createOutside.success, false);

    const deleteRes = await deleteFileImpl("dir/new.txt");
    assert.deepEqual(deleteRes, { success: true });
    await assert.rejects(
      () => fs.stat(path.join(tmpRoot, "dir", "new.txt")),
      /ENOENT/,
    );

    const deleteOutside = await deleteFileImpl(path.join(tmpRoot, "..", "x"));
    assert.equal(deleteOutside.success, false);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
