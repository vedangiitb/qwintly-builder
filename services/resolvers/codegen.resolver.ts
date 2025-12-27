import { JobContext } from "../../job/jobContext.js";
import { codegenContextInterface } from "../../types/codegenContext/codegenContext.js";
import { codegenTask } from "../../types/codegenTask.js";
import { codeIndex } from "../../types/codeIndex/codeIndex.js";
import { getFileCode } from "./helpers/getFileCode.js";

export const codegenContext = async (
  ctx: JobContext,
  codeIndex: codeIndex,
  task: codegenTask
): Promise<codegenContextInterface> => {
  const path = ctx.workspace + '/' + task.pagePath;
  let codegen_context = {
    specifications: codeIndex.projectSpecifications,
    isNewFile: task.isNewPage,
    pagePath: path,
    requirements: task.description,
    content: task.content,
    code: await getFileCode(task.isNewPage, path),
  };

  return codegen_context;
};
