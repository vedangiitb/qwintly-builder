import { Storage } from "@google-cloud/storage";

export async function uploadFileToGCS(
  projectId: string,
  path: string,
  bucketName: string,
  destination: string
) {
  const storage = new Storage({ projectId: projectId });

  await storage.bucket(bucketName).upload(path, {
    destination,
    resumable: false,
    metadata: {
      contentType: "application/zip",
    },
  });
}

export async function uploadContentToGCS(
  projectId: string,
  content: string,
  bucketName: string,
  destination: string
) {
  const storage = new Storage({ projectId });

  const file = storage.bucket(bucketName).file(destination);

  await file.save(content, {
    resumable: false,
    contentType: "application/json; charset=utf-8",
    metadata: {
      cacheControl: "no-store",
    },
  });
}
