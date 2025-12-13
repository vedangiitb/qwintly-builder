import { Storage } from "@google-cloud/storage";
import { createReadStream } from "fs";
import fs from "fs/promises";
import unzipper from "unzipper";
import { sendLog } from "./sendLog.js";

const storage = new Storage();
const BUCKET_NAME = "qwintly-builder-templates";
const TEMPLATE_ZIP = "template-v1.zip";

export async function cloneProjectTemplate(sessionId: string) {
  const workspacePath = `/tmp/workspace/${sessionId}`;
  sendLog(`Fetching template from GCS into ${workspacePath}`);

  // Ensure workspace exists
  await fs.mkdir(workspacePath, { recursive: true });

  const tmpZipPath = `/tmp/template_${sessionId}.zip`;
  const bucket = storage.bucket(BUCKET_NAME);
  const file = bucket.file(TEMPLATE_ZIP);

  try {
    sendLog("Downloading template zip from GCS...");
    await file.download({ destination: tmpZipPath });
    sendLog("Download complete.");

    sendLog("Extracting zip...");
    await extractZip(tmpZipPath, workspacePath);
    sendLog("Extraction complete.");

    // await safeRemove(path.join(workspacePath, "node_modules"));
    // await safeRemove(path.join(workspacePath, ".next"));
    // sendLog("Cleaned node_modules and .next");
  } catch (err) {
    const message = `Failed to load template from GCS: ${err}`;
    sendLog(message);
    throw new Error(message);
  } finally {
    // Always remove temp zip
    await safeRemove(tmpZipPath);
  }

  sendLog(`Template ready at ${workspacePath}`);
}
// Extract zip using unzipper (recommended for Node)
async function extractZip(zipPath: string, dest: string) {
  return new Promise((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: dest }))
      .on("close", resolve)
      .on("error", reject);
  });
}

// Safe remove
async function safeRemove(targetPath: string) {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (_) {}
}
