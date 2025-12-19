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
    await createFolder(path.join(root, folder));
  }

  for (const file of files) {
    const fullPath = path.join(root, file.path);
    await createFolder(path.dirname(fullPath));
    await createFile(fullPath, `// ${file.purpose}\n`);
  }

  return { ok: true };
}
