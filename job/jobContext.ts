// Session/workspace/env context
import jwt from "jsonwebtoken";
import {
  AGENT_LOGS_BUCKET,
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  JOB_TOKEN,
  SNAPSHOT_BUCKET,
  TEMPLATE_BUCKET,
} from "../config/env.js";

/*
 * Job context from Worker
 * JOB_TOKEN
 *
 * Env secrets/variables
 * All others
 */

let cachedJobContext: JobContext | null = null;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function createJobContext() {
  if (!JOB_TOKEN) {
    throw new Error("Missing auth token");
  }

  let tokenPayload: {
    chatId: string;
    planId: string;
    userId: string;
    requestType: string;
    provider: string;
    model: string;
    prevSessionId: string;
    sessionId: string;
    byokEnabled: boolean;
  };
  try {
    tokenPayload = jwt.verify(
      JOB_TOKEN,
      process.env.PUBLISH_SECRET!,
    ) as typeof tokenPayload;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }

  const chatId = normalizeString(tokenPayload.chatId);
  const planId = normalizeString(tokenPayload.planId);
  const userId = normalizeString(tokenPayload.userId);
  const requestType = normalizeString(tokenPayload.requestType);
  const provider = normalizeString(tokenPayload.provider);
  const model = normalizeString(tokenPayload.model);
  const prevSessionId = normalizeString(tokenPayload.prevSessionId);
  const sessionId = normalizeString(tokenPayload.sessionId);
  const byokEnabled = Boolean(tokenPayload.byokEnabled);

  return {
    chatId: chatId,
    planId: planId,
    userId: userId,
    requestType: requestType,
    provider: provider,
    model: model,
    prevSessionId: prevSessionId,
    sessionId: sessionId,
    byokEnabled: byokEnabled,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${sessionId}.zip`,
    agentLogsPath: `/tmp/${sessionId}.txt`,
    baseTemplate: "base-template.zip",
    tmpZipPath: `/tmp/template_${sessionId}.zip`,
    snapShotPath: `projects/${chatId}/${prevSessionId}.zip`,
    snapShotuploadPath: `projects/${chatId}/${sessionId}.zip`,
    prevSnapshotUploadPath: `projects/${chatId}/${prevSessionId}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET,
    projectId: GCP_PROJECT_ID_QWINTLY,
    templateBucket: TEMPLATE_BUCKET,
    genSitesProjectId: GEN_SITES_PROJECT_ID,
    agentLogsBucket: AGENT_LOGS_BUCKET,
  };
}

export type JobContext = ReturnType<typeof createJobContext>;

export function getJobContext(): JobContext {
  if (!cachedJobContext) {
    cachedJobContext = createJobContext();
  }

  return cachedJobContext;
}

export function setJobContext(ctx: JobContext) {
  cachedJobContext = ctx;
}
