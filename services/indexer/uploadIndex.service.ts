import { uploadContentToGCS } from "../../infra/gcs/upload.js";
import { JobContext } from "../../job/jobContext.js";

export const uploadIndex = async (
  content: any,
  ctx: JobContext,
  indexName: "codeIndex" | "pmIndex"
) => {
  const bucketName =
    indexName === "codeIndex" ? ctx.codeIndexBucket : ctx.pmIndexBucket;
  const projectId = ctx.projectId;

  const filePath = `indexes/${ctx.sessionId}.json`;

  await uploadContentToGCS(
    projectId,
    JSON.stringify(content, null, 2),
    bucketName,
    filePath
  );
};
