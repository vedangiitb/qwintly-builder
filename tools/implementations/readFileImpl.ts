import { SESSION_ID } from "../../config/env.js";
import { readFile } from "../../infra/fs/workspace.js";
export async function readFileImpl(path: string) {
  // TODO: use ctx
  const fullPath = `/tmp/workspace/${SESSION_ID}/` + path;
  const file = readFile(fullPath);
  return file;
}
