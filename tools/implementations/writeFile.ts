import { createFile } from "../../infra/fs/workspace.js";

export async function writeFile({ path: filePath, content }: any) {
  createFile(filePath, content);
  return { ok: true };
}
