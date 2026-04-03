import { getJobContext } from "../../job/jobContext.js";
import { ContextRepository } from "../../repository/context.repository.js";
import { CollectedContext } from "../../types/context.types.js";

export const fetchProjectContext = async (): Promise<CollectedContext> => {
  const ctx = getJobContext();
  const contextrepo = new ContextRepository();
  const context = await contextrepo.fetchCollectedContext(ctx.chatId);
  return context;
};
