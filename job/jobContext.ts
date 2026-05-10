// Session/workspace/env context
import jwt from "jsonwebtoken";
import {
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
    requestType: string;
    provider: string;
    model: string;
    userId: string;
    sessionId: string;
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
  const requestType = normalizeString(tokenPayload.requestType);
  const provider = normalizeString(tokenPayload.provider);
  const userId = normalizeString(tokenPayload.userId);
  const model = normalizeString(tokenPayload.model);
  const sessionId = normalizeString(tokenPayload.sessionId);

  return {
    chatId: chatId,
    requestType: requestType,
    tasksPlanId: planId,
    provider: provider,
    model: model,
    userId: userId,
    sessionId: sessionId,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${chatId}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET,
    projectId: GCP_PROJECT_ID_QWINTLY,
    templateBucket: TEMPLATE_BUCKET,
    genSitesProjectId: GEN_SITES_PROJECT_ID,
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
