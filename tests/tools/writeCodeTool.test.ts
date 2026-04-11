import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setJobContext } from "../../job/jobContext.js";
import { writeCodeImpl } from "../../ai/tools/implementations/writeCode.impl.js";

test("write_code: writes content and creates parent folders", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "write-code-"));

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

    const code = "export const x = 1;\n";
    const res = await writeCodeImpl("src/index.ts", code, "write test file");
    assert.deepEqual(res, { ok: true });
    assert.equal(
      await fs.readFile(path.join(tmpRoot, "src", "index.ts"), "utf-8"),
      code,
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("write_code: rejects paths outside the workspace", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "write-code-"));

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

    await assert.rejects(
      () => writeCodeImpl("../outside.txt", "x\n", "should fail"),
      /outside the workspace root|absolute but not within workspace/i,
    );
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
