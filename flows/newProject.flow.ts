import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { modifyLayout } from "../services/ai/modifyLayout.service.js";
import { planTasks } from "../services/ai/planTasks.service.js";
import { cloneTemplate } from "../services/project/cloneTemplate.service.js";
import { getRequest } from "../services/project/getRequest.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";
import { sendLog } from "../utils/logger.js";

export async function runNewProjectFlow(ctx: JobContext) {
  await step(ctx, "Cloning Snapshot", () => cloneTemplate(ctx), {
    retries: 1,
  });

  const request = await step(ctx, "Loading Request", () => getRequest(ctx), {
    retries: 2,
  });

  const tasks = await step(ctx, "Planning Tasks", () => planTasks(ctx, request), {
    retries: 1,
  });

  await step(ctx, "Modifying Folder Structure", () => modifyLayout(ctx, request), {
    retries: 1,
  });

  await step(ctx, "Zipping Project", () => zipProject(ctx), {
    retries: 0,
  });

  await step(ctx, "Uploading Snapshot", () => uploadProjectSnapshot(ctx), {
    retries: 3,
  });

  sendLog("SUCCESS");
}
