import { downloadContentsGCS } from "../../infra/gcs/download.js";
import { JobContext } from "../../job/jobContext.js";

export const fetchCodeIndex = async (ctx: JobContext): Promise<any> => {
  const bucketName = ctx.codeIndexBucket;
  const sessionId = ctx.sessionId;
  const filePath = `indexes/${sessionId}.json`;
  const filePathTemp = `indexes/code_index.json`;
  const codeIndex = await downloadContentsGCS(filePathTemp,bucketName);

  return codeIndex;
};
