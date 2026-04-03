// Session/workspace/env context
import {
  CHAT_ID,
  GCP_PROJECT_ID_QWINTLY,
  GEN_SITES_PROJECT_ID,
  REQUEST_TYPE,
  SESSION_ID,
  SNAPSHOT_BUCKET,
  TASKS_PLAN_ID,
  TEMPLATE_BUCKET,
} from "../config/env.js";

/*
 * Job context from Worker
 * CHAT_ID, SESSION_ID, REQUEST_TYPE & TASKS_PLAN_ID
 *
 * Env secrets/variables
 * SNAPSHOT_BUCKET, GCP_PROJECT_ID_QWINTLY, TEMPLATE_BUCKET, GEN_SITES_PROJECT_ID
 */

let cachedJobContext: JobContext | null = null;

export function createJobContext() {
  if (!CHAT_ID || !REQUEST_TYPE || !TASKS_PLAN_ID || !SESSION_ID) {
    throw new Error("Missing required env vars");
  }

  return {
    chatId: CHAT_ID,
    sessionId: SESSION_ID,
    requestType: REQUEST_TYPE,
    tasksPlanId: TASKS_PLAN_ID,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${CHAT_ID}.zip`,
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
