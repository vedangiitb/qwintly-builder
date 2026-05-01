import { uploadFileToGCS } from "../../infra/gcs/upload.js";
import { getJobContext } from "../../job/jobContext.js";

export async function uploadProjectSnapshot() {
  const ctx = getJobContext();
  const zipPath = ctx.zipPath;
  const chatId = ctx.chatId;
  const bucketName = ctx.snapshotBucket;
  const projectId = ctx.projectId;
  const destination = `projects/${chatId}.zip`;
  console.log(
    `Uploading project snapshot "${zipPath}" to bucket "${bucketName}" at "${destination}" (projectId="${projectId}")`,
  );

  if (!projectId || !bucketName) throw new Error("Missing required env vars");

  try {
    await uploadFileToGCS(projectId, zipPath, bucketName, destination);
    console.log(
      `Uploaded project snapshot to bucket "${bucketName}" at "${destination}"`,
    );
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : String(e);
    throw new Error(`Failed to upload project to GCS: ${errMessage}`);
  }
}
