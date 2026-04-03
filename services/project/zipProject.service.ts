import { zipFolder } from "../../infra/fs/zipFolder.js";
import { getJobContext } from "../../job/jobContext.js";

export async function zipProject() {
  const ctx = getJobContext();
  await zipFolder(ctx.workspace, ctx.zipPath);
}
