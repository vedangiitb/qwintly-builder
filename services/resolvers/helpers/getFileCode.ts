import { readFile } from "../../../infra/fs/workspace.js";

export const getFileCode = async (isNewFile: boolean, filePath: string) => {
  if (isNewFile) return "";
  return await readFile(filePath);
};
