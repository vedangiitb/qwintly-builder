import { uploadFileToGCS } from "../../infra/gcs/upload.js";
import { JobContext } from "../../job/jobContext.js";
import { logger } from "../../utils/logger.js";

export async function uploadProjectSnapshot(ctx: JobContext) {
  const zipPath = ctx.zipPath;
  const sessionId = ctx.sessionId;
  const bucketName = ctx.snapshotBucket;
  const projectId = ctx.projectId;
  const destination = `projects/${sessionId}.zip`;
  logger.info("Uploading project snapshot", {
    bucketName,
    destination,
    zipPath,
  });

  if (!projectId || !bucketName) throw new Error("Missing required env vars");

  try {
    await uploadFileToGCS(projectId, zipPath, bucketName, destination);
  } catch (e) {
    logger.error("Failed to upload project snapshot", {
      projectId,
      bucketName,
      destination,
      zipPath,
      err: e,
    });
    throw new Error(`Failed to upload project to GCS: ${e}`);
  }
}
