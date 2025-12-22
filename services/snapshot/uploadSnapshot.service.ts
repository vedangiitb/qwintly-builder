import { uploadFileToGCS } from "../../infra/gcs/upload.js";
import { JobContext } from "../../job/jobContext.js";

export async function uploadProjectSnapshot(ctx: JobContext) {
  const zipPath = ctx.zipPath;
  const sessionId = ctx.sessionId;
  const bucketName = ctx.snapshotBucket;
  const projectId = ctx.genProjectId;
  const destination = `projects/${sessionId}.zip`;
  console.log(`Uploading project to gs://${bucketName}/${destination}`);

  try {
    uploadFileToGCS(projectId, zipPath, bucketName, destination);
  } catch (e) {
    throw new Error(`Failed to upload project to GCS: ${e}`);
  }
}
