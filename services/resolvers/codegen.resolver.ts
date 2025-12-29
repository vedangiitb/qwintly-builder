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
  const path = ctx.workspace + "/" + task.pagePath;

  let codegen_context = {
    specifications: codeIndex,
    isNewFile: task.isNewPage,
    pagePath: path,
    requirements: task.description,
    content: task.content,
    fileCode: await getFileCode(task.isNewPage, path),
    dependsCode: await getDependFilesCode(ctx, task.depends),
  };

  return codegen_context;
};
