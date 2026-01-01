import { JobContext } from "../../job/jobContext.js";
import { CodegenContextInterface } from "../../types/codegenContext/codegenContext.js";
import { codegenTask } from "../../types/codegenTask.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { getDependFilesCode, getFileCode } from "./helpers/getFileCode.js";

export const codegenContext = async (
  ctx: JobContext,
  codeIndex: CodeIndex,
  task: codegenTask
): Promise<CodegenContextInterface> => {

  let codegen_context = {
    specifications: codeIndex,
    isNewFile: task.isNewPage,
    pagePath: task.pagePath,
    requirements: task.description,
    content: task.content,
    fileCode: await getFileCode(ctx, task.isNewPage, task.pagePath),
    dependsCode: await getDependFilesCode(ctx, task.depends),
  };

  return codegen_context;
};
