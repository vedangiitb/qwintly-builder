import path from "path";
import {
  createFile,
  createFolder,
  filterDescription,
  readFile,
} from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";
import { stripLeadingComments } from "../../services/validator/validators/NextRulesValidator.js";

export const writeCode = async (
  ctx: JobContext,
  filePath: string,
  code: string,
  description: string
) => {
  try {
    let fullPath: string;
    if (filePath.startsWith("/tmp") || filePath.startsWith("tmp")) {
      const path1 = path.relative(ctx.workspace, filePath);
      fullPath = ctx.workspace +  (path1.startsWith("/") ? "" : "/") + path1;
    } else {
      fullPath = ctx.workspace + (filePath.startsWith("/") ? "" : "/") + filePath;
    }

    const dirPath = path.dirname(fullPath);

    await createFolder(dirPath);

    const txt = await readFile(fullPath);
    const prevDescription = txt ? filterDescription(txt) : "";
    const newDescription = prevDescription
      ? prevDescription + "\n" + "//" + description
      : description;

    const filteredCode = stripLeadingComments(code);

    const fileContent = `//DESC_START ${newDescription} DESC_END \n${filteredCode}`;

    await createFile(fullPath, fileContent);
  } catch (err) {
    throw err;
  }
};
