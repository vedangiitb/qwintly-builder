import { JobContext } from "../../job/jobContext.js";
import { CodeIndex } from "../../types/index/codeIndex.js";
import { creatTaskInterface } from "../../types/tlTasks.interface.js";
import { getProjectStructure } from "../indexer/helpers/getProjectStructure.js";
import { codegenContext } from "../resolvers/codegen.resolver.js";
import { generateCode } from "./generateCode.js";

export const codegenService = async (
  ctx: JobContext,
  tasks: creatTaskInterface[] | undefined,
  codeIndex: CodeIndex
) => {
  if (!tasks || tasks.length === 0) {
    throw new Error("No tasks provided to codegen service.");
  }
  for (const task of tasks) {
    let codegen_context = await codegenContext(ctx, codeIndex, task);
    codegen_context.specifications.projectStructure = await getProjectStructure(
      ctx
    );
    await generateCode(codegen_context);
  }
};
