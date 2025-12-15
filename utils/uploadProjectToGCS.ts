import { Storage } from "@google-cloud/storage";

const storage = new Storage();

export async function uploadProjectToGCS(
  zipPath: string,
  bucketName: string,
  sessionId: string
) {
  const destination = `projects/${sessionId}.zip`;

  console.log(`Uploading project to gs://${bucketName}/${destination}`);

  await storage.bucket(bucketName).upload(zipPath, {
    destination,
    resumable: false,
    metadata: {
      contentType: "application/zip",
    },
  });

  console.log("Upload complete");
}
