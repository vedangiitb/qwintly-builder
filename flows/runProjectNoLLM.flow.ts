import { ProjectRequestType } from "../data/project.constants.js";
import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { buildCodeIndex } from "../services/indexer/buildCodeIndex.service.js";
import { cloneTemplate } from "../services/project/cloneTemplate.service.js";
import { fetchProjectContext } from "../services/project/fetchProjectContext.js";
import { fetchPlanTasks } from "../services/project/getRequest.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { toolOnlyService } from "../services/ai/toolOnly.service.js";

export async function runProjectNoLLMFlow(ctx: JobContext) {
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
   * Fetch project tasks
   */
  const planTasks = await step(
    ctx,
    "Loading PM Request",
    () => fetchPlanTasks(ctx.tasksPlanId),
    {
      retries: 2,
    },
  );

  if (!planTasks) {
    throw new Error("Failed to fetch plan tasks");
  }

  /*
   * Fetch collected context
   */
  const collectedContext = await step(
    ctx,
    "Fetching Project context",
    () => fetchProjectContext(ctx),
    {
      retries: 0,
    },
  );

  if (!collectedContext) {
    throw new Error("Failed to fetch collected context");
  }

  /*
   * Fetch code index
   */
  const codeIndex = await step(
    ctx,
    "Loading Code Index",
    () => buildCodeIndex(ctx),
    { retries: 2 },
  );

  if (!codeIndex) {
    throw new Error("Failed to build code index");
  }

  /*
   * Tool-only Execution (no LLM)
   */
  await step(
    ctx,
    "Tool-Only Execution",
    () => toolOnlyService(ctx, collectedContext, planTasks, codeIndex),
    { retries: 0 },
  );

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
    retries: 3,
  });
}
