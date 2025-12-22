export const SESSION_ID = process.env.SESSION_ID!;
export const REQUEST_TYPE = process.env.REQUEST_TYPE!;
export const REQUEST_BUCKET_NAME =
  process.env.BUCKET_NAME || "qwintly-builder-requests";
export const SNAPSHOT_BUCKET_NAME =
  process.env.SNAPSHOT_BUCKET_NAME || "gen-project-snapshots";
export const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY!;
export const GEN_PROJECT_ID = process.env.GEN_PROJECT_ID || "generated-sites";