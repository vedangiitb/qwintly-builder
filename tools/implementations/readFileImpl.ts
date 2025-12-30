import path from "path";
import { readFile } from "../../infra/fs/workspace.js";
import { JobContext } from "../../job/jobContext.js";
export async function readFileImpl(ctx: JobContext, dirPath: string) {
  let fullPath: string;
  if (dirPath.startsWith("/tmp") || dirPath.startsWith("tmp")) {
    const path1 = path.relative(ctx.workspace, dirPath);
    fullPath = ctx.workspace + "/" + path1;
  } else {
    fullPath = ctx.workspace + "/" + dirPath;
  }

  const file = readFile(fullPath);
  return file;
}
