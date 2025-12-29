import path from "path";
import { createFile, createFolder } from "../../infra/fs/workspace.js";

export const writeCode = async (
  filePath: string,
  code: string,
  description: string
) => {
  const fileContent = `//DESC_START ${description} DESC_END \n${code}`;

  const dirPath = path.dirname(filePath);

  await createFolder(dirPath);

  await createFile(filePath, fileContent);
};
