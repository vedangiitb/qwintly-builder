import { Storage } from "@google-cloud/storage";

export async function uploadFileToGCS(
  projectId: string,
  path: string,
  bucketName: string,
  destination: string,
  contentType = "application/zip",
) {
  const storage = new Storage({ projectId: projectId });

  await storage.bucket(bucketName).upload(path, {
    destination,
    resumable: false,
    metadata: {
      contentType,
    },
  });
}
