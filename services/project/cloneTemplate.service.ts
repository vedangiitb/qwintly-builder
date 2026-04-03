import {
  ProjectPathConstants,
  ProjectRequestType,
} from "../../data/project.constants.js";
import { createFolder, removeFolder } from "../../infra/fs/workspace.js";
import { extractZip } from "../../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../../infra/gcs/download.js";
import { getJobContext } from "../../job/jobContext.js";
import { logger } from "../logger/logger.service.js";

export async function cloneTemplate() {
  const ctx = getJobContext();
  const workspacePath = ctx.workspace;
  const chatId = ctx.chatId;

  let bucketName: string;
  let zipPath: string;
  let projectId: string = ctx.projectId!;
  const tmpZipPath = ProjectPathConstants(chatId).tmpZipPath;

  if (ctx.requestType === ProjectRequestType.NEW) {
    bucketName = ctx.templateBucket!;
    zipPath = ProjectPathConstants("").baseTemplate;
  } else {
    bucketName = ctx.snapshotBucket!;
    zipPath = ProjectPathConstants(chatId).snapShotPath;
    projectId = ctx.genSitesProjectId!;
  }
  logger.info(
    `Cloning template "${zipPath}" from bucket "${bucketName}" into "${workspacePath}" (projectId="${projectId}")`,
  );

  await createFolder(workspacePath);

  try {
    logger.info(`Downloading template zip to "${tmpZipPath}"`);
    await downloadToDestinationGCS(tmpZipPath, zipPath, bucketName, projectId);
    logger.info(`Extracting template zip from "${tmpZipPath}" to "${workspacePath}"`);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load template from GCS: ${errMessage}`);
  } finally {
    try {
      await removeFolder(tmpZipPath);
      logger.info(`Cleaned up temp zip at "${tmpZipPath}"`);
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      logger.warn(`Failed to clean up temp zip at "${tmpZipPath}": ${errMessage}`);
    }
  }

  logger.info(`Template ready at "${workspacePath}"`);
}
