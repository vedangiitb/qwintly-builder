import "dotenv/config";

/*
 * Job context from Worker
 * SESSION_ID, REQUEST_TYPE & TASKS_PLAN_ID
 *
 * Env secrets/variables
 * SNAPSHOT_BUCKET_NAME, GCP_PROJECT_ID_QWINTLY, ,GEMINI_API_KEY
 */

export const SESSION_ID = process.env.SESSION_ID!;
export const TASKS_PLAN_ID = process.env.TASKS_PLAN_ID!;
export const REQUEST_TYPE = process.env.REQUEST_TYPE!;
export const SNAPSHOT_BUCKET = process.env.SNAPSHOT_BUCKET;
export const TEMPLATE_BUCKET = process.env.TEMPLATE_BUCKET;
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
export const GCP_PROJECT_ID_QWINTLY = process.env.GCP_PROJECT_ID_QWINTLY;
export const GEN_SITES_PROJECT_ID = process.env.GEN_SITES_PROJECT_ID;

