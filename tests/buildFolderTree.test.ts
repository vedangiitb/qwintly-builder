import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { buildFolderTree } from "../services/indexer/helpers/buildFolderTree.js";
import { setJobContext } from "../job/jobContext.js";

test("buildFolderTree returns a depth-2 simple folder tree", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "folder-tree-"));

  const srcDir = path.join(tmpRoot, "src");
  const deeperDir = path.join(srcDir, "deeper");
  await fs.mkdir(deeperDir, { recursive: true });

  await fs.writeFile(path.join(tmpRoot, "README.md"), "# Readme\n", "utf-8");
  await fs.writeFile(path.join(tmpRoot, "Dockerfile"), "FROM node\n", "utf-8");
  await fs.writeFile(path.join(srcDir, "index.ts"), "export {};\n", "utf-8");
  await fs.writeFile(
    path.join(deeperDir, "tooDeep.ts"),
    "export const x = 1;\n",
    "utf-8",
  );

  const nodeModulesDir = path.join(tmpRoot, "node_modules", "pkg");
  await fs.mkdir(nodeModulesDir, { recursive: true });
  await fs.writeFile(
    path.join(nodeModulesDir, "index.ts"),
    "export {};\n",
    "utf-8",
  );

  // Ensure default rootDir works when not provided.
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

  const result = await buildFolderTree();

  const expected = ["/src", "  /src/deeper", "  index.ts", "README.md"].join(
    "\n",
  );
  assert.equal(result, expected);

  await fs.rm(tmpRoot, { recursive: true, force: true });
});

