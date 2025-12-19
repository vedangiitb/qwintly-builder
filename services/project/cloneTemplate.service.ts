import { templates } from "../../data/templates.constants.js";
import { createFolder, removeFolder } from "../../infra/fs/workspace.js";
import { extractZip } from "../../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../../infra/gcs/download.js";
import { JobContext } from "../../job/jobContext.js";

export async function cloneTemplate(ctx: JobContext) {
  const workspacePath = ctx.workspace;
  const sessionId = ctx.sessionId;
  const templateZipPath = templates.zip.default;
  const templateBucket = templates.bucket;
  console.log(`Fetching template from GCS into ${workspacePath}`);

  await createFolder(workspacePath);

  const tmpZipPath = `/tmp/template_${sessionId}.zip`;

  try {
    await downloadToDestinationGCS(tmpZipPath, templateZipPath, templateBucket);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    throw new Error(`Failed to load template from GCS: ${err}`);
  } finally {
    await removeFolder(tmpZipPath);
  }

  console.log(`Template ready at ${workspacePath}`);
}
