import { ProjectRequestType } from "../data/project.constants.js";
import { getJobContext } from "../job/jobContext.js";
import { step } from "../job/step.js";
import { buildCodeIndex } from "../services/indexer/buildCodeIndex.service.js";
import { cloneTemplate } from "../services/project/cloneTemplate.service.js";
import { fetchProjectContext } from "../services/project/fetchProjectContext.js";
import { fetchPlanTasks } from "../services/project/getRequest.service.js";
import { zipProject } from "../services/project/zipProject.service.js";
import { uploadProjectSnapshot } from "../services/snapshot/uploadSnapshot.service.js";

export async function runProjectFlow() {
  const ctx = getJobContext();
  /*
   * Clone Project Snapshot/Template
   */
  await step(
    ctx.requestType === ProjectRequestType.NEW
      ? "Cloning Template"
      : "Cloning Project Snapshot",
    () => cloneTemplate(),
    {
      retries: 1,
    },
  );

  /*
   * Fetch plan tasks, project context, and build code index
   */
  const [planTasks, collectedContext, codeIndex] = await Promise.all([
    step("Loading Plan Tasks", () => fetchPlanTasks(), {
      retries: 1,
    }),
    step("Fetching Project context", () => fetchProjectContext(), {
      retries: 1,
    }),
    step("Building Code Index", () => buildCodeIndex(), {
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
