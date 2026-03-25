import {
  ProjectPathConstants,
  ProjectRequestType,
} from "../../data/project.constants.js";
import { createFolder, removeFolder } from "../../infra/fs/workspace.js";
import { extractZip } from "../../infra/fs/zipFolder.js";
import { downloadToDestinationGCS } from "../../infra/gcs/download.js";
import { JobContext } from "../../job/jobContext.js";
import { logger } from "../../utils/logger.js";

export async function cloneTemplate(ctx: JobContext) {
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
  logger.info("Fetching template", {
    zipPath,
    bucketName,
    workspacePath,
  });

  await createFolder(workspacePath);

  try {
    await downloadToDestinationGCS(tmpZipPath, zipPath, bucketName,projectId);
    await extractZip(tmpZipPath, workspacePath);
  } catch (err) {
    logger.error("Failed to load template from GCS", {
      zipPath,
      bucketName,
      workspacePath,
      err,
    });
    throw new Error(`Failed to load template from GCS: ${err}`);
  } finally {
    await removeFolder(tmpZipPath);
  }

  logger.info("Template ready", { workspacePath });
}
