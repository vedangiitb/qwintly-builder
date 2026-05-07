import test from "node:test";
import assert from "node:assert/strict";
import { createBuilderGraph } from "../../services/ai/builder/createBuilderGraph.js";
import { AgentState } from "../../services/ai/state.js";

test("builder graph: repairs once then ends when validation passes", async () => {
  let validateCalls = 0;

  const graph = createBuilderGraph({
    plan: async () => ({
      plannerTasks: [{ description: "do x", targets: ["a.ts"] }],
    }),
    codegen: async (state) => ({ iteration: state.iteration + 1 }),
    validate: async () => {
      validateCalls += 1;
      if (validateCalls === 1) {
        return {
          validationErrors: [
            { type: "next", filePath: "app/page.tsx", message: "bad" },
          ],
        };
      }
      return { validationErrors: [] };
    },
    validationPlan: async () => ({
      plannerTasks: [{ description: "fix x", targets: ["a.ts"] }],
    }),
  });

  const initial: AgentState = {
    iteration: 0,
    planTasks: [],
    collectedContext: {} as any,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    editedFiles: [],
  };

  const result = await graph.invoke(initial);
  assert.equal(result.iteration, 2);
  assert.equal(result.validationErrors.length, 0);
});

test("builder graph: stops after 3 total passes even if bugs remain", async () => {
  const graph = createBuilderGraph({
    plan: async () => ({
      plannerTasks: [{ description: "do x", targets: ["a.ts"] }],
    }),
    codegen: async (state) => ({ iteration: state.iteration + 1 }),
    validate: async () => ({
      validationErrors: [
        { type: "heuristic", filePath: "app/layout.tsx", message: "still bad" },
      ],
    }),
    validationPlan: async () => ({
      plannerTasks: [{ description: "fix x", targets: ["a.ts"] }],
    }),
  });

  const initial: AgentState = {
    iteration: 0,
    planTasks: [],
    collectedContext: {} as any,
    plannerTasks: [],
    validationErrors: [],
    validationFixHistory: [],
    editedFiles: [],
  };

  const result = await graph.invoke(initial);
  assert.equal(result.iteration, 3);
  assert.ok(result.validationErrors.length > 0);
});
