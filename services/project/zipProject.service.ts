import { zipFolder } from "../../infra/fs/zipFolder.js";
import { JobContext } from "../../job/jobContext.js";

export async function zipProject(ctx: JobContext) {
  await zipFolder(ctx.workspace, ctx.zipPath);
}
