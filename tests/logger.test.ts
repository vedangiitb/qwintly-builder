import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { logger } from "../services/logger/logger.service.js";
import { setJobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";

const withTestContext = async (workspace: string) => {
  await fs.mkdir(workspace, { recursive: true });
  setJobContext({
    chatId: "test-chat",
    sessionId: "test-session",
    requestType: "NEW" as any,
    tasksPlanId: "plan-1",
    workspace,
    zipPath: path.join(workspace, "out.zip"),
    snapshotBucket: "b",
    projectId: "p",
    templateBucket: "t",
    genSitesProjectId: "g",
  });
};

test("logger: emits backward compatible fields + severity + ts + meta", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qwintly-builder-"));
  await withTestContext(tmp);

  const origLog = console.log;
  const captured: any[] = [];
  console.log = (msg?: any) => {
    captured.push(msg);
  };

  try {
    logger.info("hello", { foo: "bar" });
  } finally {
    console.log = origLog;
  }

  assert.equal(captured.length, 1);
  const parsed = JSON.parse(String(captured[0]));
  assert.equal(parsed.message, "hello");
  assert.equal(parsed.type, "INFO");
  assert.equal(parsed.chatId, "test-chat");
  assert.equal(parsed.sessionId, "test-session");
  assert.equal(parsed.severity, "INFO");
  assert.equal(typeof parsed.ts, "string");
  assert.deepEqual(parsed.meta, { foo: "bar" });
});

test("logger.error: includes structured error stack", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qwintly-builder-"));
  await withTestContext(tmp);

  const origErr = console.error;
  const captured: any[] = [];
  console.error = (msg?: any) => {
    captured.push(msg);
  };

  try {
    const err = new Error("boom");
    logger.error("something failed", err, { where: "unit-test" });
  } finally {
    console.error = origErr;
  }

  assert.equal(captured.length, 1);
  const parsed = JSON.parse(String(captured[0]));
  assert.equal(parsed.type, "ERROR");
  assert.equal(parsed.severity, "ERROR");
  assert.equal(parsed.message, "something failed");
  assert.equal(parsed.meta.where, "unit-test");
  assert.equal(parsed.error.message, "boom");
  assert.ok(typeof parsed.error.stack === "string");
});

test("step: emits STATUS heartbeats when running long work", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qwintly-builder-"));
  await withTestContext(tmp);

  const origLog = console.log;
  const captured: any[] = [];
  console.log = (msg?: any) => {
    captured.push(msg);
  };

  try {
    await step(
      "Heartbeat Step",
      () => new Promise<void>((resolve) => setTimeout(resolve, 60)),
      { heartbeatIntervalMs: 10 },
    );
  } finally {
    console.log = origLog;
  }

  const parsed = captured.map((s) => {
    try {
      return JSON.parse(String(s));
    } catch {
      return null;
    }
  });

  const heartbeatCount = parsed.filter(
    (l) => l && l.type === "STATUS" && l.meta?.heartbeat === true,
  ).length;
  assert.ok(heartbeatCount >= 1);
});

