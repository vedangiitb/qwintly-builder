import fs from "fs/promises";
import path from "path";

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
    await fs.mkdir(path.join(root, folder), { recursive: true });
  }

  for (const file of files) {
    const fullPath = path.join(root, file.path);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, `// ${file.purpose}\n`, "utf-8");
  }

  return { ok: true };
}
