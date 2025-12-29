import { readFile } from "../../../infra/fs/workspace.js";
import { JobContext } from "../../../job/jobContext.js";
import { DependsCode } from "../../../types/codegenContext/codegenContext.js";

export const getFileCode = async (isNewFile: boolean, filePath: string) => {
  if (isNewFile) return "";
  return await readFile(filePath);
};

export const getDependFilesCode = async (
  ctx: JobContext,
  filePaths: string[]
): Promise<DependsCode[]> => {
  let dependFileCodes: DependsCode[] = [];
  for (const filePath of filePaths) {
    const code = await readFile(ctx.workspace + "/" + filePath);
    dependFileCodes.push({ file: filePath, code });
  }
  return dependFileCodes;
};
