import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setJobContext } from "../../job/jobContext.js";
import { searchImpl } from "../../ai/tools/implementations/search.impl.js";

test("search: returns matches with file:line and content", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "search-"));

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

    const unique = `UNIQUE_TOKEN_${Date.now()}`;
    await fs.writeFile(path.join(tmpRoot, "a.txt"), `hello ${unique}\n`, "utf-8");
    await fs.writeFile(path.join(tmpRoot, "b.txt"), `other line\n${unique}\n`, "utf-8");

    const results = await searchImpl(unique);
    assert.ok(results.length >= 1);
    assert.ok(results.some((r) => r.path.includes("a.txt:1") || r.path.includes("b.txt:2")));
    assert.ok(results.some((r) => r.content.includes(unique)));
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});

test("search: returns [] for empty query and no matches", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "search-"));

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

    await fs.writeFile(path.join(tmpRoot, "a.txt"), "hello\n", "utf-8");
    const results = await searchImpl("(*");
    assert.deepEqual(results, []);
  } finally {
    await fs.rm(tmpRoot, { recursive: true, force: true });
  }
});
