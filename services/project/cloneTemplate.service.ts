import {
  ProjectPathConstants,
  ProjectRequestType,
} from "../../data/project.constants.js";
import { createFolder, removeFolder } from "@vedangiitb/qwintly-core";
import { extractZip } from "../../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../../infra/gcs/download.js";
import { getJobContext } from "../../job/jobContext.js";

export async function cloneTemplate() {
  const ctx = getJobContext();
  const workspacePath = ctx.workspace;
  const sessionId = ctx.sessionId;

  let bucketName: string;
  let zipPath: string;
  let projectId: string = ctx.projectId!;
  const tmpZipPath = ProjectPathConstants(sessionId).tmpZipPath;

  if (ctx.requestType === ProjectRequestType.NEW) {
    bucketName = ctx.templateBucket!;
    zipPath = ProjectPathConstants("").baseTemplate;
  } else {
    bucketName = ctx.snapshotBucket!;
    zipPath = ProjectPathConstants(sessionId).snapShotPath;
    projectId = ctx.genSitesProjectId!;
  }
  console.log(
    `Cloning template "${zipPath}" from bucket "${bucketName}" into "${workspacePath}" (projectId="${projectId}")`,
  );

  await createFolder(workspacePath);

  try {
    console.log(`Downloading template zip to "${tmpZipPath}"`);
    await downloadToDestinationGCS(tmpZipPath, zipPath, bucketName, projectId);
    console.log(
      `Extracting template zip from "${tmpZipPath}" to "${workspacePath}"`,
    );
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load template from GCS: ${errMessage}`);
  } finally {
    try {
      await removeFolder(tmpZipPath);
      console.log(`Cleaned up temp zip at "${tmpZipPath}"`);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.warn(
        `Failed to clean up temp zip at "${tmpZipPath}": ${errMessage}`,
      );
    }
  }

  console.log(`Template ready at "${workspacePath}"`);
}
