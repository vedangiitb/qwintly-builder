import { createFolder, removeFolder } from "@vedangiitb/qwintly-core";
import { ProjectRequestType } from "../../data/project.constants.js";
import { extractZip } from "../../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../../infra/gcs/download.js";
import { getJobContext } from "../../job/jobContext.js";

export async function cloneTemplate() {
  const ctx = getJobContext();
  const workspacePath = ctx.workspace;

  let bucketName: string;
  let zipPath: string;
  let projectId: string = ctx.projectId!;
  const isNewRequest = ctx.requestType === ProjectRequestType.NEW;
  const tmpZipPath = ctx.tmpZipPath;

  if (isNewRequest) {
    bucketName = ctx.templateBucket!;
    zipPath = ctx.baseTemplate;
  } else {
    bucketName = ctx.snapshotBucket!;
    zipPath = ctx.snapShotPath;
    projectId = ctx.genSitesProjectId!;
  }
  console.log(
    `Cloning template "${zipPath}" from bucket "${bucketName}" into "${workspacePath}" (projectId="${projectId}")`,
  );

  await createFolder(workspacePath);

  try {
    const downloadAndExtract = async (
      sourceZipPath: string,
      sourceBucketName: string,
      sourceProjectId: string,
    ) => {
      console.log(`Downloading template zip to "${tmpZipPath}"`);
      await downloadToDestinationGCS(
        tmpZipPath,
        sourceZipPath,
        sourceBucketName,
        sourceProjectId,
      );
      console.log(
        `Extracting template zip from "${tmpZipPath}" to "${workspacePath}"`,
      );
      await extractZip(tmpZipPath, workspacePath);
    };

    try {
      await downloadAndExtract(zipPath, bucketName, projectId);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const isSnapshotNotFound =
        !isNewRequest && errMessage.includes("GCS file not found:");

      if (!isSnapshotNotFound) {
        throw err;
      }

      console.warn(
        `Previous snapshot not found, cloning base template (snapshot="${zipPath}", bucket="${bucketName}").`,
      );

      bucketName = ctx.templateBucket!;
      zipPath = ctx.baseTemplate;
      projectId = ctx.projectId!;

      console.log(
        `Cloning template "${zipPath}" from bucket "${bucketName}" into "${workspacePath}" (projectId="${projectId}")`,
      );
      await downloadAndExtract(zipPath, bucketName, projectId);
    }
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
