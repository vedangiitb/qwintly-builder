import { getJobContext } from "../../job/jobContext.js";
import { ContextRepository } from "../../repository/context.repository.js";
import { getQwintlyCore } from "../core/qwintlyCore.service.js";

export const projectInfoUpdate = async () => {
  const core = await getQwintlyCore();
  const ctx = getJobContext();
  const projectInfo = await core.buildProjectInfoIdx();

  const contextRepo = new ContextRepository();
  await contextRepo.updateProjectInfo(ctx.chatId, projectInfo);
};
