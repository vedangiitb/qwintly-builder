import { JobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { modifyLayout } from "../services/ai/modifyLayout.service.js";
import { cloneProjectSnapShot } from "../services/project/fetchProject.service.js";
import { getRequest } from "../services/project/getRequest.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";

export async function runUpdateProjectFlow(ctx: JobContext) {
  await step(ctx, "Cloning Snapshot", () => cloneProjectSnapShot(ctx), {
    retries: 1,
  });

  const request = await step(ctx, "Loading Request", () => getRequest(ctx), {
    retries: 2,
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
}
