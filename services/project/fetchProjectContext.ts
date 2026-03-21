import { JobContext } from "../../job/jobContext.js";
import { ContextRepository } from "../../repository/context.repository.js";
import { CollectedContext } from "../../types/context.types.js";

export const fetchProjectContext = async (
  ctx: JobContext,
): Promise<CollectedContext> => {
  const contextrepo = new ContextRepository();
  const context = await contextrepo.fetchCollectedContext(ctx.sessionId);
  return context;
};
