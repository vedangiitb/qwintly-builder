import { JobContext } from "../../job/jobContext.js";
import { creatTaskInterface } from "../../types/tlTasks.interface.js";
import { codegenContext } from "../resolvers/codegen.resolver.js";
import { generateCode } from "./generateCode.js";

export const codegenService = async (
  ctx: JobContext,
  tasks: creatTaskInterface[] | undefined,
  codeIndex: any
) => {
  if (!tasks || tasks.length === 0) {
    throw new Error("No tasks provided to codegen service.");
  }
  for (const task of tasks) {
    const codegen_context = await codegenContext(ctx, codeIndex, task);
    console.log(codegen_context);
    await generateCode(codegen_context);
  }
};
