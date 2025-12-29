import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { planTasks } from "../services/ai/planTasks.service.js";
import { codegenService } from "../services/codegen/codegen.service.js";
import { updateCodeIndex } from "../services/indexer/updateCodeIndex.service.js";
import { cloneTemplate } from "../services/project/cloneTemplate.service.js";
import { fetchCodeIndex } from "../services/project/fetchCodeIndex.service.js";
import { getRequest } from "../services/project/getRequest.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";

export async function runNewProjectFlow(ctx: JobContext) {
  await step(ctx, "Cloning Snapshot", () => cloneTemplate(ctx), {
    retries: 1,
  });

  const pmMessage = await step(ctx, "Loading Request", () => getRequest(ctx), {
    retries: 2,
  });

  const codeIndex = await step(ctx, "Loading Code Index", () => fetchCodeIndex(ctx), {
    retries: 2,
  });

  const tasks = await step(ctx, "Planning Tasks", () => planTasks(ctx, pmMessage,codeIndex), {
    retries: 1,
  });

  console.log(tasks)

  await step(ctx, "Working on Coding Tasks", () => codegenService(ctx, tasks, codeIndex), {
    retries: 1,
  });

  await step(ctx, "Updating code index", () => updateCodeIndex(ctx,pmMessage,codeIndex),{
    retries:1,
  })

  await step(ctx, "Zipping Project", () => zipProject(ctx), {
    retries: 0,
  });

  await step(ctx, "Uploading Snapshot", () => uploadProjectSnapshot(ctx), {
    retries: 3,
  });

}
