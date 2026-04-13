import test from "node:test";
import assert from "node:assert/strict";
import {
  ApplyPatchSchema,
  ListDirSchema,
  ReadFileSchema,
  SearchSchema,
  SubmitCodegenDoneSchema,
  SubmitPlannerTasksSchema,
  WriteFileSchema,
  codegenTools,
  plannerTools,
} from "qwintly-ai-core";

test("schemas: have names and required parameters", () => {
  const schemas = [
    ReadFileSchema,
    ApplyPatchSchema,
    SearchSchema,
    ListDirSchema,
    SubmitPlannerTasksSchema,
    WriteFileSchema,
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
    ["apply_patch", "read_file", "write_file", "submit_codegen_done"].sort(),
  );

  const planner = plannerTools();
  assert.equal(planner.length, 1);
  const plannerNames = (planner[0].functionDeclarations ?? []).map((d: any) => d.name);
  assert.deepEqual(
    plannerNames.sort(),
    ["read_file", "search", "list_dir", "submit_planner_tasks"].sort(),
  );
});
