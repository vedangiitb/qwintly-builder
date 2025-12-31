import { ProjectRequestType } from "../../data/project.constants.js";
import { templates } from "../../data/templates.constants.js";
import { createFolder, removeFolder } from "../../infra/fs/workspace.js";
import { extractZip } from "../../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../../infra/gcs/download.js";
import { JobContext } from "../../job/jobContext.js";

export async function cloneTemplate(ctx: JobContext) {
  const workspacePath = ctx.workspace;
  const sessionId = ctx.sessionId;

  let bucketName: string;
  let zipPath: string;
  const tmpZipPath = `/tmp/template_${sessionId}.zip`;

  if (ctx.requestType === ProjectRequestType.NEW) {
    bucketName = templates.bucket;
    zipPath = templates.zip.default;
  } else {
    bucketName = ctx.snapshotBucket;
    zipPath = `projects/${sessionId}.zip`;
  }
  console.log(
    `Fetching template ${zipPath} from GCS bucket ${bucketName} into ${workspacePath}`
  );

  await createFolder(workspacePath);

  try {
    await downloadToDestinationGCS(tmpZipPath, zipPath, bucketName);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    throw new Error(`Failed to load template from GCS: ${err}`);
  } finally {
    await removeFolder(tmpZipPath);
  }

  console.log(`Template ready at ${workspacePath}`);
}
