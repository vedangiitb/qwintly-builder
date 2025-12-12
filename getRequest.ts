import { Storage } from "@google-cloud/storage";
import { BUCKET_NAME } from "./index.js";

const storage = new Storage();

export async function getRequest(sessionId: string): Promise<any> {
  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  const filePath = `requests/${sessionId}.json`;
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(filePath);

  try {
    const [exists] = await file.exists();
    if (!exists) {
      throw new Error(`Request file not found: ${filePath}`);
    }

    const [contents] = await file.download();
    return JSON.parse(contents.toString("utf-8"));
  } catch (err: any) {
    console.error("Error reading request JSON:", err);
    throw new Error(`Failed to load request for sessionId: ${sessionId}`);
  }
}
