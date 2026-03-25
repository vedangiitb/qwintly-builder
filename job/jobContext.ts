// Session/workspace/env context
import {
  GCP_PROJECT_ID_QWINTLY,
  REQUEST_TYPE,
  SESSION_ID,
  SNAPSHOT_BUCKET,
  TASKS_PLAN_ID,
  TEMPLATE_BUCKET,
} from "../config/env.js";

/*
 * Job context from Worker
 * SESSION_ID, REQUEST_TYPE & TASKS_PLAN_ID
 *
 * Env secrets/variables
 * SNAPSHOT_BUCKET, GCP_PROJECT_ID_QWINTLY, TEMPLATE_BUCKET
 */

export function createJobContext() {
  if (!SESSION_ID || !REQUEST_TYPE) {
    throw new Error("Missing required env vars");
  }

  return {
    sessionId: SESSION_ID,
    requestType: REQUEST_TYPE,
    tasksPlanId: TASKS_PLAN_ID,
    workspace: `/tmp/workspace`,
    zipPath: `/tmp/${SESSION_ID}.zip`,
    snapshotBucket: SNAPSHOT_BUCKET,
    projectId: GCP_PROJECT_ID_QWINTLY,
    templateBucket: TEMPLATE_BUCKET,
    genSitesProjectId: process.env.GEN_SITES_PROJECT_ID,
  };
}

export type JobContext = ReturnType<typeof createJobContext>;
