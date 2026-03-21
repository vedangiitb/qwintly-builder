import { preflightValidator } from "../../services/validator/preflightValidator.service.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { JobContext } from "../../job/jobContext.js";

export const validateImpl = async (ctx: JobContext, codeIndex: CodeIndex) => {
  return await preflightValidator(ctx, codeIndex);
};
