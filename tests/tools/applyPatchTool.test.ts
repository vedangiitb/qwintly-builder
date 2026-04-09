import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setJobContext } from "../../job/jobContext.js";
import { applyPatchImpl } from "../../ai/tools/implementations/applyPatch.impl.js";

test("apply_patch: updates an existing text file", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

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
    assert.equal(await fs.readFile(path.join(tmpRoot, "foo.txt"), "utf-8"), "a\nbb\nc\n");
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: rejects patches that add/delete files or update missing files", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

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

    const addFilePatch = [
      "*** Begin Patch",
      "*** Add File: new.txt",
      "+hello",
      "*** End Patch",
      "",
    ].join("\n");

    const addRes = await applyPatchImpl(addFilePatch);
    assert.equal(addRes.success, false);
    assert.ok((addRes.error ?? "").includes("Add File"));

    const missingUpdate = [
      "*** Begin Patch",
      "*** Update File: missing.txt",
      "@@",
      "+x",
      "*** End Patch",
      "",
    ].join("\n");

    const missingRes = await applyPatchImpl(missingUpdate);
    assert.equal(missingRes.success, false);
    assert.ok((missingRes.error ?? "").includes("not found"));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("apply_patch: rejects binary/unsupported file extensions", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "apply-patch-"));

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

    await fs.writeFile(path.join(tmpRoot, "image.png"), "not really binary\n", "utf-8");
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
