import test from "node:test";
import assert from "node:assert/strict";
import { ApplyPatchSchema } from "../../ai/tools/schemas/applyPatch.schema.js";
import { ListDirSchema } from "../../ai/tools/schemas/listDir.schema.js";
import { ReadFileSchema } from "../../ai/tools/schemas/readFile.schema.js";
import { SearchSchema } from "../../ai/tools/schemas/search.schema.js";
import { SubmitPlannerTasksSchema } from "../../ai/tools/schemas/submitPlannerTasks.schema.js";
import { writeCodeSchema } from "../../ai/tools/schemas/writeCode.schema.js";
import { SubmitCodegenDoneSchema } from "../../ai/tools/schemas/submitCodegenDone.schema.js";
import { codegenTools } from "../../ai/tools/toolsets/codegenTools.js";
import { plannerTools } from "../../ai/tools/toolsets/plannerTools.js";

test("schemas: have names and required parameters", () => {
  const schemas = [
    ReadFileSchema,
    ApplyPatchSchema,
    SearchSchema,
    ListDirSchema,
    SubmitPlannerTasksSchema,
    writeCodeSchema,
    SubmitCodegenDoneSchema,
  ] as const;

  for (const schema of schemas) {
    assert.equal(typeof schema.name, "string");
    assert.ok(schema.name.length > 0);
    assert.equal(typeof schema.description, "string");
    assert.ok(schema.parameters);
    assert.ok(Array.isArray(schema.parameters.required));
    assert.ok(schema.parameters.required.length >= 1);
  }
});

test("toolsets: expose the expected schema names", () => {
  const codegen = codegenTools();
  assert.equal(codegen.length, 1);
  const codegenNames = (codegen[0].functionDeclarations ?? []).map((d: any) => d.name);
  assert.deepEqual(
    codegenNames.sort(),
    ["apply_patch", "read_file", "submit_codegen_done"].sort(),
  );

  const planner = plannerTools();
  assert.equal(planner.length, 1);
  const plannerNames = (planner[0].functionDeclarations ?? []).map((d: any) => d.name);
  assert.deepEqual(
    plannerNames.sort(),
    ["read_file", "search", "list_dir", "submit_planner_tasks"].sort(),
  );
});
