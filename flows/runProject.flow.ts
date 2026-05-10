import { ProjectRequestType } from "../data/project.constants.js";
import { getJobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { runBuilderAiFlow } from "../services/ai/graph.js";
import { getQwintlyCore } from "../services/core/qwintlyCore.service.js";
import { buildPageConfig } from "../services/pageConfig/buildPageConfig.service.js";
import { cloneTemplate } from "../services/project/cloneTemplate.service.js";
import { fetchProjectContext } from "../services/project/fetchProjectContext.js";
import { fetchPlanTasks } from "../services/project/getRequest.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";

export async function runProjectFlow() {
  const ctx = getJobContext();
  const core = await getQwintlyCore();
  /*
   * Fetch plan tasks, project context, and clone project Snapshot/Template
   */
  const [planTasks, collectedContext] = await Promise.all([
    step("Loading Plan Tasks", () => fetchPlanTasks(), {
      retries: 1,
    }),
    step("Fetching Project context", () => fetchProjectContext(), {
      retries: 1,
    }),
    step(
      ctx.requestType === ProjectRequestType.NEW
        ? "Cloning Template"
        : "Cloning Project Snapshot",
      () => cloneTemplate(),
      {
        retries: 1,
      },
    ),
  ]);

  if (!planTasks || !collectedContext) {
    throw new Error("Failed to fetch data");
  }

  /*
   * Deep Agent Execution
   */
  await step(
    "Running Builder AI Flow",
    () => runBuilderAiFlow(planTasks, collectedContext),
    {
      retries: 0,
    },
  );

  /*
   * Generate Page Config
   */
  await step("Building Page Config", () => buildPageConfig(), {
    retries: 1,
  });

  /*
   * Generate Project Info Index
   */
  await step("Building Project Info", () => core.buildProjectInfoIdx(), {
    retries: 1,
  });

  /*
   * Zip Project
   */
  await step("Zipping Project to upload", () => zipProject(), {
    retries: 0,
  });

  /*
   * Upload Project Snapshot
   */
  await step("Uploading Snapshot", () => uploadProjectSnapshot(), {
    retries: 2,
  });
}
