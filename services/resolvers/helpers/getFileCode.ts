import { JobContext } from "../../../job/jobContext.js";
import { readFileImpl } from "../../../tools/implementations/readFileImpl.js";
import { DependsCode } from "../../../types/codegenContext/codegenContext.js";

export const getFileCode = async (ctx:JobContext,isNewFile: boolean, filePath: string) => {
  if (isNewFile) return "";
  return await readFileImpl(ctx, filePath);
};

export const getDependFilesCode = async (
  ctx: JobContext,
  filePaths: string[]
): Promise<DependsCode[]> => {
  let dependFileCodes: DependsCode[] = [];
  for (const filePath of filePaths) {
    const code = await readFileImpl(ctx, filePath);
    dependFileCodes.push({ file: filePath, code });
  }
  return dependFileCodes;
};
