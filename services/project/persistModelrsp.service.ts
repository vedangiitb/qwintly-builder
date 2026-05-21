import { getJobContext } from "../../job/jobContext.js";
import { appendFile, mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { inspect } from "node:util";
import { uploadFileToGCS } from "../../infra/gcs/upload.js";

function safeToText(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  try {
    const seen = new WeakSet<object>();
    return JSON.stringify(
      value,
      (_key, val) => {
        if (typeof val === "object" && val !== null) {
          if (seen.has(val)) return "[Circular]";
          seen.add(val);
        }
        if (typeof val === "bigint") return val.toString();
        return val;
      },
      2,
    );
  } catch {
    return inspect(value, { depth: 6, breakLength: 120 });
  }
}

async function ensureParentDir(filePath: string) {
  const parent = path.dirname(filePath);
  await mkdir(parent, { recursive: true });
}

export const persistModelRsp = async (modelInput: any, modelOutput: any) => {
  const ctx = getJobContext();
  const filePath = ctx.agentLogsPath;
  const timestamp = new Date().toISOString();

  await ensureParentDir(filePath);

  const prefix = `timestamp=${timestamp} sessionId=${ctx.sessionId} chatId=${ctx.chatId}`;
  const entry =
    [
      `${prefix} type=modelInput`,
      safeToText(modelInput),
      `${prefix} type=modelOutput`,
      safeToText(modelOutput),
      "",
    ].join("\n") + "\n";

  await appendFile(filePath, entry, { encoding: "utf8" });
};

export const uploadModelRspLogs = async () => {
  const ctx = getJobContext();
  const projectId = ctx.projectId;
  const bucketName = ctx.agentLogsBucket;
  const logsPath = ctx.agentLogsPath;
  const destination = `${ctx.chatId}/${ctx.sessionId}.txt`;

  if (!projectId || !bucketName) {
    console.error("Missing required env vars");
    return;
  }

  try {
    await stat(logsPath);
  } catch {
    console.warn(`Model response log file not found at "${logsPath}"`);
    return;
  }

  console.log(
    `Uploading model response logs "${logsPath}" to bucket "${bucketName}" at "${destination}" (projectId="${projectId}")`,
  );

  try {
    await uploadFileToGCS(
      projectId,
      logsPath,
      bucketName,
      destination,
      "text/plain",
    );
    console.log(
      `Uploaded model response logs to bucket "${bucketName}" at "${destination}"`,
    );
  } catch (e) {
    const errMessage = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Failed to upload model response logs to GCS: ${errMessage}`,
    );
  }
};
