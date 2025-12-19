import path from "path";
import { createFile, createFolder } from "../../infra/fs/workspace.js";

export async function createProjectStructure({
  root,
  folders,
  files,
}: {
  root: string;
  folders: string[];
  files: { path: string; purpose: string }[];
}) {
  for (const folder of folders) {
    createFolder(path.join(root, folder));
  }

  for (const file of files) {
    const fullPath = path.join(root, file.path);
    createFolder(path.dirname(fullPath));
    createFile(fullPath, `// ${file.purpose}\n`);
  }

  return { ok: true };
}
