import test from "node:test";
import assert from "node:assert/strict";
import { runToolLoop } from "../../services/ai/toolLoopRunner.js";

test("tool loop: redacts apply_patch.patch_string from model contents", async () => {
  const requests: unknown[] = [];
  const patchCalls: Record<string, unknown>[] = [];

  const sentinelPatch = "SENTINEL_PATCH_STRING_12345";

  let callCount = 0;
  const aiCall = async (request: unknown) => {
    requests.push(request);
    callCount += 1;

    if (callCount === 1) {
      return {
        functionCalls: [
          { name: "apply_patch", args: { patch_string: sentinelPatch } },
        ],
      };
    }

    return { functionCalls: [], text: "done" };
  };

  await runToolLoop({
    initialContents: [{ role: "user", parts: [{ text: "hi" }] }],
    tools: [] as any,
    aiCall: aiCall as any,
    handlers: {
      apply_patch: async (args) => {
        patchCalls.push(args);
        return { success: true };
      },
    },
    maxSteps: 5,
  });

  assert.equal(patchCalls.length, 1);
  assert.equal(patchCalls[0].patch_string, sentinelPatch);
  assert.equal(requests.length, 2);
  assert.equal(JSON.stringify(requests[1]).includes(sentinelPatch), false);
});

test("tool loop: compacts to initial + memory + tail window", async () => {
  const requests: unknown[] = [];

  let callCount = 0;
  const aiCall = async (request: unknown) => {
    requests.push(request);
    callCount += 1;

    if (callCount <= 4) {
      return {
        functionCalls: [{ name: "read_file", args: { path: `f${callCount}.txt` } }],
      };
    }

    return { functionCalls: [], text: "done" };
  };

  await runToolLoop({
    initialContents: [{ role: "user", parts: [{ text: "go" }] }],
    tools: [] as any,
    aiCall: aiCall as any,
    contextPolicy: { tailMessages: 2 },
    handlers: {
      read_file: async (args) => {
        return { path: String(args.path ?? ""), content: "x" };
      },
    },
    maxSteps: 10,
  });

  const lastReq = requests[requests.length - 1] as any[];
  assert.ok(Array.isArray(lastReq));

  // tailMessages=2 => 1 initial + 1 memory + 2 tail messages
  assert.equal(lastReq.length, 4);
  const memoryCount = lastReq.filter((m) =>
    typeof m?.parts?.[0]?.text === "string" &&
    m.parts[0].text.startsWith("MEMORY (tool trace summary):"),
  ).length;
  assert.equal(memoryCount, 1);
});

test("tool loop: caps read_file when end_line is omitted", async () => {
  const requests: unknown[] = [];
  const handlerArgs: Record<string, unknown>[] = [];

  let callCount = 0;
  const aiCall = async (request: unknown) => {
    requests.push(request);
    callCount += 1;

    if (callCount === 1) {
      return { functionCalls: [{ name: "read_file", args: { path: "big.txt" } }] };
    }

    return { functionCalls: [], text: "done" };
  };

  await runToolLoop({
    initialContents: [{ role: "user", parts: [{ text: "go" }] }],
    tools: [] as any,
    aiCall: aiCall as any,
    contextPolicy: { readFileDefaultMaxLines: 200 },
    handlers: {
      read_file: async (args) => {
        handlerArgs.push(args);
        return { path: String(args.path ?? ""), content: "line1" };
      },
    },
    maxSteps: 5,
  });

  assert.equal(handlerArgs.length, 1);
  assert.equal(handlerArgs[0].start_line, 1);
  assert.equal(handlerArgs[0].end_line, 200);

  // Second model call should see the effective args and the capped tool response wrapper.
  assert.equal(JSON.stringify(requests[1]).includes('"end_line":200'), true);
  assert.equal(JSON.stringify(requests[1]).includes('"truncated":true'), true);
});

