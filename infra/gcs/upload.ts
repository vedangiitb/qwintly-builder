import { Storage } from "@google-cloud/storage";

const storage = new Storage();

export async function uploadFileToGCS(
  path: string,
  bucketName: string,
  destination: string
) {
  await storage.bucket(bucketName).upload(path, {
    destination,
    resumable: false,
    metadata: {
      contentType: "application/zip",
    },
  });
}
