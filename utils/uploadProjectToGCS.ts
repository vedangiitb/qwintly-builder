import { Storage } from "@google-cloud/storage";
import { sendLog } from "./sendLog.js";

const storage = new Storage();

export async function uploadProjectToGCS(
  zipPath: string,
  bucketName: string,
  sessionId: string
) {
  const destination = `projects/${sessionId}.zip`;

  sendLog(`Uploading project to gs://${bucketName}/${destination}`);

  await storage.bucket(bucketName).upload(zipPath, {
    destination,
    resumable: false,
    metadata: {
      contentType: "application/zip",
    },
  });

  sendLog("Upload complete");
}
