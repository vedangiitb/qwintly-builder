import { File, Storage } from "@google-cloud/storage";
import { GCP_PROJECT_ID_QWINTLY } from "../../config/env.js";

async function getExistingFile(
  bucketName: string,
  filePath: string,
  project: string = GCP_PROJECT_ID_QWINTLY!,
): Promise<File> {
  const storage = new Storage({ projectId: project });
  const file = storage.bucket(bucketName).file(filePath);

  const [exists] = await file.exists();
  if (!exists) {
    throw new Error(`GCS file not found: gs://${bucketName}/${filePath}`);
  }

  return file;
}

export async function downloadToDestinationGCS(
  destination: string,
  filePath: string,
  bucketName: string,
  projectId?: string,
): Promise<void> {
  const file = await getExistingFile(bucketName, filePath, projectId);
  await file.download({ destination });
}

export async function downloadContentsGCS<T = unknown>(
  filePath: string,
  bucketName: string,
): Promise<T> {
  const file = await getExistingFile(bucketName, filePath);
  const [contents] = await file.download();

  return JSON.parse(contents.toString("utf-8")) as T;
}
