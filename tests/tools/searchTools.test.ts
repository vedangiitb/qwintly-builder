import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createTestContext } from "../helpers/createTestContext.js";
import { searchImpl } from "../../tools/implementations/searchImpl.js";
import { retrieveContextImpl } from "../../tools/implementations/retrieveContextImpl.js";
import { CodeIndex } from "../../types/index/codeIndex.js";

test("search tool finds tokens", async () => {
  const { ctx, workspace, cleanup } = await createTestContext();
  const token = `SEARCH_TOKEN_${Date.now()}`;

  try {
    const filePath = path.join(workspace, "src", "searchTarget.ts");
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, `export const marker = "${token}";`, "utf-8");

    const results = await searchImpl(ctx, token, 5);
    assert.ok(results.length > 0);
    assert.ok(results.some((r) => r.file.includes("searchTarget.ts")));
  } finally {
    await cleanup();
  }
});

test("retrieveContextImpl returns scored chunks", async () => {
  const codeIndex: CodeIndex = {
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
      folderTree: [
        {
          name: "auth.ts",
          path: "src/auth.ts",
          isDir: false,
          depth: 1,
          summary: "Authentication helpers",
          exports: ["login", "logout"],
        },
        {
          name: "ui.ts",
          path: "src/ui.ts",
          isDir: false,
          depth: 1,
          summary: "UI helpers",
        },
      ],
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
  };

  const chunks = await retrieveContextImpl(codeIndex, "auth", 2);
  assert.ok(chunks.length > 0);
  assert.equal(chunks[0].file, "src/auth.ts");
});
