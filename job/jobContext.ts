// Session/workspace/env context
import {
  REQUEST_BUCKET_NAME,
  REQUEST_TYPE,
  SESSION_ID,
  SNAPSHOT_BUCKET_NAME,
} from "../config/env.js";

export function createJobContext() {
  if (!SESSION_ID || !REQUEST_TYPE) {
    throw new Error("Missing required env vars");
  }

  return {
    sessionId: SESSION_ID,
    requestType: REQUEST_TYPE,
    workspace: `/tmp/workspace/${SESSION_ID}`,
    zipPath: `/tmp/${SESSION_ID}.zip`,
    requestsBucket: REQUEST_BUCKET_NAME || "qwintly-builder-requests",
    snapshotBucket: SNAPSHOT_BUCKET_NAME || "qwintly-project-snapshots",
    templateBucket: "qwintly-builder-templates",
  };
}

export type JobContext = ReturnType<typeof createJobContext>;
