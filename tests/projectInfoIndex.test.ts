import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { setJobContext } from "../job/jobContext.js";
import { computeProjectInfo } from "../services/indexer/projectInfoIndex.js";

test("computeProjectInfo indexes app router pages from page.config.ts", async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "project-info-"));

  const appDir = path.join(tmpRoot, "app");
  await fs.mkdir(appDir, { recursive: true });

  await fs.writeFile(
    path.join(appDir, "page.config.ts"),
    "export const config = { elements: [] };\n",
    "utf-8",
  );

  const aboutDir = path.join(appDir, "about");
  await fs.mkdir(aboutDir, { recursive: true });
  await fs.writeFile(
    path.join(aboutDir, "page.config.ts"),
    [
      "export const config = {",
      "  elements: [],",
      "  sectionName: \"Hero\",",
      "  sectionName: \"FAQ\",",
      "};",
      "",
    ].join("\n"),
    "utf-8",
  );

  const pricingDir = path.join(appDir, "(marketing)", "pricing");
  await fs.mkdir(pricingDir, { recursive: true });
  await fs.writeFile(
    path.join(pricingDir, "page.config.ts"),
    "export const config = { elements: [] };\n",
    "utf-8",
  );

  const parallelHelpDir = path.join(appDir, "@modal", "help");
  await fs.mkdir(parallelHelpDir, { recursive: true });
  await fs.writeFile(
    path.join(parallelHelpDir, "page.config.ts"),
    "export const config = { elements: [] };\n",
    "utf-8",
  );

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

  const projectInfo = await computeProjectInfo(tmpRoot);

  assert.equal(projectInfo.lastUpdatedPlanVersion, 1);
  assert.deepEqual(
    projectInfo.uiPages.map((p) => p.pageRoute),
    ["/", "/about", "/pricing"],
  );

  const rootPage = projectInfo.uiPages.find((p) => p.pageRoute === "/");
  assert.ok(rootPage);
  assert.equal(rootPage.pageName, "root");
  assert.equal(rootPage.description, "root page for this project");
  assert.equal(rootPage.sections, undefined);
  assert.equal("sections" in rootPage, false);

  const aboutPage = projectInfo.uiPages.find((p) => p.pageRoute === "/about");
  assert.ok(aboutPage);
  assert.equal(aboutPage.pageName, "about");
  assert.equal(aboutPage.description, "about page for this project");
  assert.deepEqual(
    aboutPage.sections,
    [
      { sectionName: "Hero", description: "Hero section for this page" },
      { sectionName: "FAQ", description: "FAQ section for this page" },
    ],
  );

  const pricingPage = projectInfo.uiPages.find(
    (p) => p.pageRoute === "/pricing",
  );
  assert.ok(pricingPage);
  assert.equal(pricingPage.pageName, "pricing");

  await fs.rm(tmpRoot, { recursive: true, force: true });
});

