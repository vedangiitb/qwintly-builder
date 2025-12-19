import { downloadContentsGCS } from "../../infra/gcs/download.js";
import { JobContext } from "../../job/jobContext.js";

export async function getRequest(ctx: JobContext): Promise<any> {
  const sessionId = ctx.sessionId;
  const bucket = ctx.requestsBucket;
  if (!sessionId) {
    throw new Error("sessionId is required");
  }

  const filePath = `requests/${sessionId}.json`;

  try {
    return await downloadContentsGCS(filePath, bucket);
  } catch (err: any) {
    throw new Error(`Failed to load request for sessionId: ${sessionId}`);
  }
}
