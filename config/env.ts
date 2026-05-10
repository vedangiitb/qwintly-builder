import "dotenv/config";

/*
 * Job context from Worker
 * JOB_TOKEN
 *
 * Env secrets/variables
 * All others
 */

export const JOB_TOKEN = process.env.JOB_TOKEN!;
export const SNAPSHOT_BUCKET = process.env.SNAPSHOT_BUCKET;
export const TEMPLATE_BUCKET = process.env.TEMPLATE_BUCKET;
export const GCP_PROJECT_ID_QWINTLY = process.env.GCP_PROJECT_ID_QWINTLY;
export const GEN_SITES_PROJECT_ID = process.env.GEN_SITES_PROJECT_ID;
export const SUPABASE_ENDPOINT = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY!;
export const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL_GEN_EVENTS!;
export const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN_GEN_EVENTS!;
