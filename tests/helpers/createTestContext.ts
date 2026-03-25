import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { JobContext } from "../../job/jobContext.js";

type TestContext = {
  ctx: JobContext;
  workspace: string;
  cleanup: () => Promise<void>;
};

export const createTestContext = async (): Promise<TestContext> => {
  const workspace = await fs.mkdtemp(path.join(os.tmpdir(), "qwintly-tools-"));
  const ctx: JobContext = {
    sessionId: "test-session",
    requestType: "NEW",
    tasksPlanId: "test-plan",
    workspace,
    zipPath: path.join(workspace, "out.zip"),
    snapshotBucket: "test-bucket",
    projectId: "test-project",
    templateBucket: "test-template",
    genSitesProjectId: "test-gs-id",
  };

  return {
    ctx,
    workspace,
    cleanup: async () => {
      await fs.rm(workspace, { recursive: true, force: true });
    },
  };
};
