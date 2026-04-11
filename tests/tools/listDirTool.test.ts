import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setJobContext } from "../../job/jobContext.js";
import { listDirImpl } from "../../ai/tools/implementations/listDir.impl.js";

test("list_dir: lists directories first, then files (depth=1)", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "list-dir-"));

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
    assert.equal(depth99Clamped, ["/b", "  /d", "    e.txt", "  c.txt"].join("\n"));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("list_dir: handles missing paths and non-directories", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "list-dir-"));

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

    assert.equal(await listDirImpl("missing", 1), "not found");

    await fs.writeFile(path.join(tmpRoot, "file.txt"), "x\n", "utf-8");
    assert.equal(await listDirImpl("file.txt", 1), "not a directory: file.txt");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
