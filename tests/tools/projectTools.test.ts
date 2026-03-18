import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createTestContext } from "../helpers/createTestContext.js";
import { getProjectInfoImpl } from "../../tools/implementations/getProjectInfoImpl.js";
import { updatePackageJsonImpl } from "../../tools/implementations/updatePackageJsonImpl.js";
import { validateImpl } from "../../tools/implementations/validateImpl.js";
import { CodeIndex } from "../../types/index/codeIndex.js";

const createEmptyIndex = (): CodeIndex => ({
  projectConfig: {
    framework: {
      name: "test",
      router: "none",
      language: "ts",
      styling: "none",
      uiLibrary: "none",
      stateManagement: "none",
    },
    runtime: {
      target: "node",
      rendering: "none",
      serverActions: "none",
      apiRoutes: "none",
      dataFetching: "none",
    },
    tooling: {
      packageManager: "npm",
      linting: "none",
      formatting: "none",
      testing: "none",
    },
  },
  projectConventions: {
    folderStructure: { folders: [] },
    routingConventions: {
      pagePattern: "",
      layoutPattern: "",
      defaultPage: "",
      templatePattern: "",
      loadingPattern: "",
      errorPattern: "",
      notFoundPattern: "",
      routeGroupPattern: "",
      dynamicSegmentPattern: "",
      catchAllSegmentPattern: "",
      optionalCatchAllSegmentPattern: "",
      apiRoutesAllowed: false,
    },
    namingConventions: {
      components: "",
      hooks: "",
      files: "",
      folders: "",
      cssModules: "",
    },
    componentConventions: {
      componentFilePattern: "",
      preferredComponentType: "",
      propsTyping: "",
      clientDirectiveUsage: "",
    },
    stylingConventions: {
      approach: "",
      globalStyles: "",
      cssModulePattern: "",
      tailwindConfig: "",
    },
    importConventions: {
      pathAliases: {},
      importOrder: [],
    },
    frontendOnlyRules: {
      disallowedPatterns: [],
      disallowedDirectories: [],
      rationale: "",
    },
    allowedShadcnComponents: {
      components: [],
    },
  },
  projectIndex: {
    folderTree: [],
    legend: {
      isDir: "boolean",
      depth: "number",
      path: "string",
      ext: "string",
      summary: "string",
      dependencies: "string[]",
      exports: "string[]",
      tags: "string[]",
      route: "string",
      kind: {},
    },
  },
});

test("getProjectInfoImpl reads package.json and tsconfig.json", async () => {
  const { ctx, workspace, cleanup } = await createTestContext();

  try {
    await fs.writeFile(
      path.join(workspace, "package.json"),
      JSON.stringify({ name: "demo", version: "1.0.0" }, null, 2),
      "utf-8"
    );
    await fs.writeFile(
      path.join(workspace, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true } }, null, 2),
      "utf-8"
    );

    const info = await getProjectInfoImpl(ctx);
    assert.equal(info.ok, true);
    assert.equal(info.packageJson?.name, "demo");
    assert.equal(info.tsconfig?.compilerOptions?.strict, true);
  } finally {
    await cleanup();
  }
});

test("updatePackageJsonImpl updates fields", async () => {
  const { ctx, workspace, cleanup } = await createTestContext();

  try {
    await fs.writeFile(
      path.join(workspace, "package.json"),
      JSON.stringify({ name: "demo", version: "1.0.0", scripts: {} }, null, 2),
      "utf-8"
    );

    const result = await updatePackageJsonImpl(ctx, {
      version: "1.0.1",
      scripts: { test: "node --test" },
    });
    assert.equal(result.ok, true);

    const updated = JSON.parse(
      await fs.readFile(path.join(workspace, "package.json"), "utf-8")
    );
    assert.equal(updated.version, "1.0.1");
    assert.equal(updated.scripts.test, "node --test");
  } finally {
    await cleanup();
  }
});

test("validateImpl runs in no-LLM mode", async () => {
  const { ctx, cleanup } = await createTestContext();
  const codeIndex = createEmptyIndex();
  const previous = process.env.SKIP_VALIDATOR_AGENT;
  process.env.SKIP_VALIDATOR_AGENT = "1";

  try {
    const result = await validateImpl(ctx, codeIndex);
    assert.ok(result?.ok !== undefined);
  } finally {
    if (previous === undefined) {
      delete process.env.SKIP_VALIDATOR_AGENT;
    } else {
      process.env.SKIP_VALIDATOR_AGENT = previous;
    }
    await cleanup();
  }
});
