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
    let normalizedPath = filePath;
    if (normalizedPath.startsWith("/tmp/workspace")) {
      normalizedPath = normalizedPath.slice("/tmp/workspace".length);
    } else if (normalizedPath.startsWith("tmp/workspace")) {
      normalizedPath = normalizedPath.slice("tmp/workspace".length);
    }
    normalizedPath = normalizedPath.replace(/^[\/\\]+/, "");
    fullPath = path.join(ctx.workspace, normalizedPath);

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
