import { ProjectRequestType } from "../data/project.constants.js";
import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { buildCodeIndex } from "../services/indexer/buildCodeIndex.service.js";
import { cloneTemplate } from "../services/project/cloneTemplate.service.js";
import { fetchProjectContext } from "../services/project/fetchProjectContext.js";
import { fetchPlanTasks } from "../services/project/getRequest.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";

export async function runProjectFlow(ctx: JobContext) {
  /*
   * Clone Project Snapshot/Template
   */
  await step(
    ctx,
    ctx.requestType === ProjectRequestType.NEW
      ? "Cloning Template"
      : "Cloning Project Snapshot",
    () => cloneTemplate(ctx),
    {
      retries: 1,
    },
  );

  /*
   * Fetch plan tasks, project context, and build code index
   */
  const [planTasks, collectedContext, codeIndex] = await Promise.all([
    step(ctx, "Loading PM Request", () => fetchPlanTasks(ctx.tasksPlanId), {
      retries: 1,
    }),
    step(ctx, "Fetching Project context", () => fetchProjectContext(ctx), {
      retries: 1,
    }),
    await step(ctx, "Building Code Index", () => buildCodeIndex(ctx), {
      retries: 2,
    }),
  ]);

  if (!planTasks || !collectedContext || !codeIndex) {
    throw new Error("Failed to fetch data");
  }

  /*
   * Deep Agent Execution (TODO)
   */

  /*
   * Generate Project Info Index (TODO)
   */

  /*
   * Zip Project
   */
  await step(ctx, "Zipping Project to upload", () => zipProject(ctx), {
    retries: 0,
  });

  /*
   * Upload Project Snapshot
   */
  await step(ctx, "Uploading Snapshot", () => uploadProjectSnapshot(ctx), {
    retries: 2,
  });
}
